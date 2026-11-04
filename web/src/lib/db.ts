import path from "path";
import fs from "fs";

/**
 * One tiny async API over Postgres.
 *  - With DATABASE_URL set (Neon in production) it talks to real Postgres through `pg`.
 *  - Without it, it runs an embedded Postgres (PGlite) stored in web/data/pglite, so local
 *    development needs no keys and uses the exact same SQL as production.
 * Timestamps are stored as DOUBLE PRECISION milliseconds so both drivers return plain numbers.
 */

type Row = Record<string, unknown>;
interface Runner {
  query(sql: string, params?: unknown[]): Promise<Row[]>;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DOUBLE PRECISION NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_provider TEXT,
  plan_ref TEXT,
  plan_renews_at DOUBLE PRECISION
);
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  handle TEXT UNIQUE NOT NULL,
  profile_json TEXT NOT NULL,
  created_at DOUBLE PRECISION NOT NULL,
  updated_at DOUBLE PRECISION NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id),
  email TEXT NOT NULL,
  created_at DOUBLE PRECISION NOT NULL,
  UNIQUE (page_id, email)
);
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  target TEXT,
  country TEXT,
  created_at DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS events_page_time ON events (page_id, created_at);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id),
  link_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  slot_start DOUBLE PRECISION NOT NULL,
  note TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_ref TEXT,
  created_at DOUBLE PRECISION NOT NULL
);
CREATE INDEX IF NOT EXISTS bookings_page_slot ON bookings (page_id, slot_start);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_ref TEXT,
  amount INTEGER,
  currency TEXT,
  status TEXT NOT NULL,
  created_at DOUBLE PRECISION NOT NULL
);
CREATE TABLE IF NOT EXISTS link_health (
  page_id TEXT NOT NULL,
  link_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status INTEGER,
  ok BOOLEAN NOT NULL,
  checked_at DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (page_id, link_id)
);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS pages_custom_domain ON pages (custom_domain);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DOUBLE PRECISION NOT NULL
);
ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'reset';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
`;

interface Ctx {
  runner: Runner;
  transaction<T>(fn: (r: Runner) => Promise<T>): Promise<T>;
}

const g = globalThis as unknown as { __mmlDb?: Promise<Ctx> };

async function open(): Promise<Ctx> {
  const url = process.env.DATABASE_URL;
  let ctx: Ctx;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    ctx = {
      runner: { query: async (sql, params) => (await pool.query(sql, params as unknown[])).rows },
      async transaction(fn) {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const out = await fn({ query: async (sql, params) => (await c.query(sql, params as unknown[])).rows });
          await c.query("COMMIT");
          return out;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
    };
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = path.join(process.cwd(), "data", "pglite");
    fs.mkdirSync(dir, { recursive: true });
    const lite = new PGlite(dir);
    await lite.waitReady;
    ctx = {
      runner: { query: async (sql, params) => (await lite.query(sql, params as unknown[])).rows as Row[] },
      transaction: (fn) =>
        lite.transaction((tx) => fn({ query: async (sql, params) => (await tx.query(sql, params as unknown[])).rows as Row[] })),
    };
  }
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await ctx.runner.query(stmt);
  return ctx;
}

function ctx(): Promise<Ctx> {
  if (!g.__mmlDb) g.__mmlDb = open();
  return g.__mmlDb;
}

/** All rows. Use $1, $2… placeholders. */
export async function all<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await ctx()).runner.query(sql, params)) as T[];
}

/** First row or undefined. */
export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await all<T>(sql, params))[0];
}

/** Run a write; returns nothing. */
export async function run(sql: string, params: unknown[] = []): Promise<void> {
  await all(sql, params);
}

export async function transaction<T>(fn: (r: Runner) => Promise<T>): Promise<T> {
  return (await ctx()).transaction(fn);
}

import crypto from "crypto";
import { one, run } from "./db";

export type TokenPurpose = "reset" | "verify";

const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

/** Makes a one-time token for a user. Only its hash is stored, so a database leak can't be used to reset accounts. */
export async function createToken(userId: string, purpose: TokenPurpose, ttlMs: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await run("DELETE FROM password_resets WHERE user_id = $1 AND purpose = $2", [userId, purpose]);
  await run("INSERT INTO password_resets (token_hash, user_id, purpose, expires_at) VALUES ($1,$2,$3,$4)", [hash(token), userId, purpose, Date.now() + ttlMs]);
  return token;
}

/** Returns the user id and deletes the token, or null if it is unknown, used, or expired. */
export async function consumeToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await one<{ user_id: string; expires_at: number }>("SELECT user_id, expires_at FROM password_resets WHERE token_hash = $1 AND purpose = $2", [hash(token), purpose]);
  if (!row) return null;
  await run("DELETE FROM password_resets WHERE token_hash = $1", [hash(token)]);
  return row.expires_at > Date.now() ? row.user_id : null;
}

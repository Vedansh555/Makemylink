# Linkss backend — what's free vs. what needs a key

Split into two lists: what can be built right now with **zero signups, zero API keys, $0 cost**, and what genuinely needs you (or whoever builds this) to create an account somewhere and paste in a key. Detailed enough that any developer or AI tool can build it from this file alone.

Status: `better-sqlite3` and `bcryptjs` are already installed in `web/package.json` (free npm packages, no account needed). Nothing else is built yet — this file is the spec.

---

## Part A — Fully buildable for free, right now, no accounts

Stack: **SQLite** (a database that's just one file on disk — no server, no signup) + **Next.js API routes** (already in this project) + **bcryptjs** (password hashing) + a small hand-rolled signed-cookie session (no auth provider needed).

### 1. Database — `web/data/linkss.db`
A single SQLite file, created automatically on first run. Two tables:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  handle TEXT UNIQUE NOT NULL,
  profile_json TEXT NOT NULL,   -- the Profile object from src/lib/types.ts, as JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

`web/src/lib/db.ts` — opens the file with `better-sqlite3`, runs the `CREATE TABLE IF NOT EXISTS` statements on startup. Add `web/data/` to `.gitignore` (the db file shouldn't be committed).

### 2. Sessions — no auth provider, just a signed cookie
- Generate a random 32-byte secret once, save it as `SESSION_SECRET` in `.env.local` (already gitignored). No external service — just `crypto.randomBytes(32).toString("hex")` run once in a terminal.
- `web/src/lib/session.ts`: `sign(payload)` → `base64(json) + "." + HMAC-SHA256(base64, SESSION_SECRET)`. `verify(cookieValue)` checks the HMAC matches before trusting the payload. Store `{ userId }`.
- Set the cookie as `httpOnly`, `sameSite: "lax"`, `secure` in production.

### 3. Password hashing
`bcryptjs` (pure JS, no native build issues, no account). `hash(password, 10)` on signup, `compare(password, hash)` on login.

### 4. API routes (all in `web/src/app/api/`)
| Route | Method | Does |
|---|---|---|
| `/api/auth/signup` | POST | `{email, password, handle}` → create user + blank page, set session cookie |
| `/api/auth/login` | POST | `{email, password}` → verify, set session cookie |
| `/api/auth/logout` | POST | clear the cookie |
| `/api/auth/me` | GET | return the logged-in user's id/email, or 401 |
| `/api/page` | GET | return the logged-in user's saved `Profile` JSON |
| `/api/page` | PUT | `{profile}` → save it (overwrite `profile_json`, bump `updated_at`) |
| `/api/page/[handle]` | GET | public — look up a page by handle for anyone to view (no login needed) |

### 5. Wire it into the existing app
- `web/src/app/[handle]/page.tsx`: currently only serves the 7 hardcoded `demoProfiles`. Change it to: look up the handle in the `pages` table first; if not found, fall back to `demoProfiles` (keeps all the existing example pages working). This makes the route dynamic instead of fully static.
- `web/src/components/editor/Editor.tsx`: the "Publish" button currently only saves to `localStorage`. If a session cookie exists, also `PUT /api/page`. If not, show a "Create a free account to publish" prompt that links to `/signup`.
- New pages: `web/src/app/signup/page.tsx` and `web/src/app/login/page.tsx` — plain email/password forms posting to the API routes above.

**Everything in Part A needs no third-party account, no API key, and costs nothing.** It's enough for real signup, login, and saving/publishing a page that's actually backed by a database instead of just the browser's local storage.

---

## Part B — Needs you to create an account and paste in a key

These can't be built blind — each needs a real account because they involve sending real money, real email, or real file storage at scale. I'll build the code the moment you (or whoever's building this) has the key; the code on our side is usually small.

| Need | Why Part A can't cover it | Suggested free-tier provider | What you'd give me |
|---|---|---|---|
| **Taking real payments** (the $6/$12 or ₹149/₹399 plans) | No way to legally move money without a licensed payment processor | **Stripe** (global) + **Razorpay** (India/UPI) — both have free sandboxes, no cost until you actually charge someone | A publishable key + secret key from each dashboard |
| **Sending real email** (password reset, "your trial is ending") | SQLite/Next.js can't send email on its own — needs an outgoing mail service so it doesn't get marked spam | **Resend** (3,000 free emails/month) | An API key |
| **Hosting this for real** (so `linkss.co` is live, not just your laptop) | SQLite is one file on one machine — fine for now, but a real deployed site needs a server that keeps running | **Vercel** (free tier, made by the Next.js team) — note: Vercel's servers don't keep local files between requests, so moving off SQLite to a hosted Postgres (**Supabase** or **Neon**, both free tier) happens at the same time as this step | A Vercel account connected to this GitHub repo, and (if moving off SQLite) a database connection string |
| **Large photo uploads at scale** | Storing many user photos as base64 in a SQLite file gets slow/bloated past a few hundred users | **Cloudflare R2** or **Supabase Storage** (both free tier) | An API key / bucket credentials |
| **A real domain** (`linkss.co`) | Needs to be bought and pointed at the host | Any registrar (Namecheap, Porkbun, etc.) | Nothing from me — you just buy it and point DNS at wherever we host |

**None of these are needed to finish Part A.** Everything in Part A works entirely on your own machine, for free, forever, with no outside dependency.

---

## Suggested order
1. Part A (full local signup/login/save — no keys needed).
2. **Resend** (email) — cheapest, fastest account to make, unblocks password reset.
3. **Vercel + Supabase/Neon** — puts the site online for real, swaps SQLite for a hosted Postgres database (same schema above, just a different connection).
4. **Stripe + Razorpay** — only once you're ready to actually charge people.

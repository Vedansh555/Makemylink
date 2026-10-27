# Linkss — full project status

One file with everything: what this is, how it works, what's done, what's left, which API keys are needed and when, and ideas for later. Written so anyone — you, me later, or another AI — can pick this up cold.

---

## 1. What this is

**Linkss** — a Linktree/Liinks competitor (link-in-bio pages). A creator signs up, picks one of 135 designer themes, adds their links/products/socials, and gets a page like `linkss.co/handle`. Target niche from research (see `research_notes/`): fashion/beauty creators in India + globally, undercutting Linktree on fees and design.

Code lives in `web/`. It's a single Next.js 15 app (App Router, TypeScript, Tailwind v4).

---

## 2. How it all works right now

```
web/
├─ src/app/                    ← pages & API routes
│  ├─ page.tsx                 ← homepage (hero, themes gallery, pricing, FAQ)
│  ├─ create/page.tsx          ← the page editor
│  ├─ preview/page.tsx         ← full-screen preview of your draft
│  ├─ signup/, login/          ← auth forms
│  ├─ [handle]/page.tsx        ← PUBLIC creator pages (e.g. /aria, /kai) — reads
│  │                             from the database first, falls back to the 7
│  │                             built-in demo profiles if no DB row exists
│  └─ api/
│     ├─ auth/{signup,login,logout,me}/route.ts
│     └─ page/route.ts, page/[handle]/route.ts   ← save/load a creator's page
│
├─ src/lib/
│  ├─ types.ts                 ← the `Profile` shape (name, bio, links, looks, theme...)
│  ├─ demo.ts                  ← 7 hand-written example creators (Aria, Kai, Noor...)
│  ├─ themes.ts                ← ALL 135 themes: 28 "families" (layout+shape) ×
│  │                             several color palettes each. This is the biggest file.
│  ├─ pricing.ts                ← plan prices (USD global / INR India)
│  ├─ draft.ts                  ← saves the editor's current draft to localStorage
│  ├─ db.ts                     ← opens `web/data/linkss.db` (SQLite), creates tables
│  └─ session.ts                ← signed-cookie login sessions (no auth provider)
│
└─ src/components/
   ├─ bio/BioPage.tsx           ← renders ONE creator's actual page, in any theme
   ├─ editor/Editor.tsx         ← the big "build your page" UI
   ├─ landing/                  ← homepage sections (Hero, Pricing, Nav, etc.)
   ├─ three/ChromeScene.tsx     ← the live 3D chrome ball (react-three-fiber)
   └─ ui/QRCodeCanvas.tsx       ← offline QR code generator (no external service)
```

**The data flow:** a profile is one JSON object (`Profile` type). The editor edits it, autosaves to `localStorage` (works even logged out), and — once logged in — also saves it for real via `PUT /api/page` into SQLite. Visiting `linkss.co/handle` looks that handle up in the database; if nobody's claimed it, it shows one of the 7 built-in demo pages instead (so the homepage's examples always work).

**Auth:** email + password, hashed with bcrypt, a signed cookie (HMAC, not JWT, no library) proves who's logged in. No third-party auth service — entirely self-contained.

**Themes:** a theme = a `family` (defines shape: borders, buttons, fonts, structure — e.g. "Brutalist" vs "Glass" vs "Chrome") + a `palette` (5 colors). 28 families, 135 total theme combinations. Picking a family is the expensive part (real CSS work); adding a new palette to an existing family is cheap (one line).

---

## 3. What's done

- Full homepage: hero with live 3D, theme gallery (auto-scrolling + draggable), features, pricing (India/global), FAQ.
- Page editor: links, folders (collapsible groups), products/looks, media kit, social links, theme picker (135 themes, filterable by family), accent color override, font override, cover photo, avatar.
- 135 live themes across 28 design families.
- Real backend: SQLite database, signup/login/logout, sessions, password hashing, publish-for-real (not just localStorage).
- QR code generation (offline, no external API).
- Light/dark mode.
- 7 example creator pages covering different niches (fashion, music/DJ, beauty, photography, pets, travel).

## 4. What's NOT done yet (in rough priority order)

1. **No real email.** Signup works, but there's no "forgot password," no welcome email, no notifications. Needs Resend (see §5).
2. **No payments.** The pricing page shows plans but nothing charges a card. Needs Stripe (global) + Razorpay (India/UPI).
3. **Not deployed anywhere.** It only runs on this machine (`localhost:3000`). Needs real hosting.
4. **SQLite won't survive real hosting as-is.** Most hosts (Vercel) don't keep local files between requests — SQLite needs to move to a hosted Postgres (Supabase/Neon) at the same time as deploying for real.
5. **No image hosting at scale.** Avatars/covers/product photos are stored as base64 text directly in the database row. Fine for testing, will get slow once there are many users with photos — needs real object storage (Cloudflare R2 / Supabase Storage) eventually.
6. **No handle-uniqueness UI polish.** Signup lets you pick a handle but there's minimal "sorry, that's taken, try another" flow refinement.
7. **No account settings page** (change password, change email, delete account, cancel subscription).
8. **No analytics** (views/clicks per page) — needs the database wired to count visits, plus a dashboard UI.
9. **Legal pages missing**: Terms of Service, Privacy Policy — required before taking real signups/payments.
10. **No mobile app / no native share flow** — web only, which is fine for v1.

## 5. API keys / accounts needed, and exactly when

| # | What | Needed for | Provider (free tier) | Blocks what if missing |
|---|---|---|---|---|
| 1 | `RESEND_API_KEY` | Sending real email | [resend.com](https://resend.com) — 3,000 free emails/mo | Password reset, any notification email |
| 2 | Vercel project + GitHub connection | Hosting the site live | [vercel.com](https://vercel.com) — free tier | The site being reachable at a real URL at all |
| 3 | `DATABASE_URL` (Postgres) | Replacing SQLite for real hosting | [supabase.com](https://supabase.com) or [neon.tech](https://neon.tech) — both free tier | Data surviving between requests once deployed |
| 4 | Stripe publishable + secret key | Charging cards (global) | [stripe.com](https://stripe.com) — free sandbox, no cost until you charge someone | Any paid plan outside India |
| 5 | Razorpay key id + secret | Charging via UPI (India) | [razorpay.com](https://razorpay.com) — free sandbox | India pricing actually working |
| 6 | A bought domain | `linkss.co` instead of a Vercel subdomain | any registrar | Looking like a real product |
| 7 | Cloudflare R2 or Supabase Storage keys | Photo uploads at scale | both free tier | Nothing urgent — current base64 approach works fine early on |

**You don't need any of these to keep developing locally.** Everything in §3 already works with zero keys. Tell me whenever you've made one of these accounts and I'll wire it in — I can't create any of them myself (that's a hard rule I follow, not a choice).

## 6. Content still needed from you (not code — actual words/decisions)

- Final pricing: the ₹149/₹399 and $6/$12 numbers in `lib/pricing.ts` are my placeholder suggestions from the market research, not confirmed real prices.
- Real copy for Terms of Service / Privacy Policy (or confirmation to draft generic ones).
- A real support email address (currently placeholder `hello@aria.studio`-style emails only exist on demo profiles, not for Linkss itself).
- Decide the actual domain name (`linkss.co` assumed throughout the code/copy — confirm or change).
- Real brand assets if you want them: a proper logo (currently a CSS-drawn "✦" mark), any brand guidelines.

## 7. Feature ideas for later (not urgent, roughly ordered by effort)

**Cheap, doable anytime:**
- A few free SEO tools (QR generator page, engagement-rate calculator) once signup/payments exist — see `ROADMAP.md` for the reasoning on why not now.
- More demo/example creator pages covering more niches.
- Per-block style editing (not just accent color/font — spacing, button shape per element). Liinks has this; it's the natural next step up from the current accent/font override.

**Medium effort:**
- Click/view analytics dashboard.
- Instagram auto-import of latest posts (needs Instagram API approval).
- Email capture → actually stored somewhere and exportable (currently the "Join my list" form on creator pages doesn't save anywhere real).

**Bigger:**
- Affiliate/product marketplace browsing (like Linktree Shops).
- Team/agency accounts managing multiple creator pages.
- Native mobile app.

---

## 8. Quick reference: running it locally

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```
First run auto-creates `web/data/linkss.db`. No `.env.local` setup is required for local dev to basically work, but you should create one with a `SESSION_SECRET` (any random string) before relying on login sessions — see `BACKEND.md` for the exact steps.

See also: **`BACKEND.md`** (backend build details) and **`ROADMAP.md`** (feature prioritization reasoning from competitor research).

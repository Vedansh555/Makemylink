# Going to production: what is done, what is left

## Done in code
- Security headers on every page: CSP, HSTS, X-Frame-Options (no clickjacking), nosniff, Referrer-Policy, Permissions-Policy.
- `javascript:` and `data:` links are blocked on public pages and stripped on save (stored XSS fix).
- Uploaded images limited to PNG/JPEG/WebP/GIF data URLs or https (no SVG).
- Saved pages are validated and size-capped (6 MB body, 100 links, 100 products, field length limits). The handle is forced to the account's own handle.
- Rate limits: login 10 per 15 min per IP, signup 5 per hour per IP, saves 60 per minute per user.
- CSRF: login, signup, logout and save reject cross-site requests (Origin check) on top of `SameSite=Lax` cookies.
- Passwords: 8 to 72 characters, bcrypt cost 12, equal response time for unknown emails (no email probing).
- Sessions: HMAC-signed, now expire after 30 days. `SESSION_SECRET` is required (32+ chars) in production.
- Reserved handles (`login`, `api`, `admin`, ...) cannot be claimed.

## Blocking: the database
The site runs on Vercel, but SQLite writes to a local file. Vercel's filesystem is read-only and wiped between requests, so signup and publish will not persist there. Move to hosted Postgres (Neon or Supabase, free tier). Same two tables (`users`, `pages`).

## Needed from you
1. **Hosted Postgres**: create a Neon or Supabase project and send the connection string (or add it to Vercel as `DATABASE_URL`).
2. **`SESSION_SECRET`** in Vercel env vars: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste the output.
3. **Email (Resend)**: needed for email verification and password reset. API key plus a sending domain.
4. **Domain**: buy one (for example `makemylink.co`) and point it at Vercel. HTTPS is automatic.
5. **Payments** (when you want to charge): Stripe and/or Razorpay keys. Pricing UI exists, checkout does not.
6. **Image storage** (before many users upload photos): Cloudflare R2 or Supabase Storage. Today photos are stored as base64 inside the page JSON.
7. **Rate limiting across instances**: free Upstash Redis URL and token (the current limiter is per server instance).

## Still to build after those
- Email verification and password reset.
- MFA (TOTP) for accounts.
- Privacy policy and terms pages, cookie notice if you add analytics.
- Error monitoring (Sentry free tier) and uptime check.
- Automated database backups (Neon and Supabase include point-in-time restore on paid tiers).
- `robots.txt`, `sitemap.xml` and social preview images.
- Run `npm audit` and enable Dependabot on the GitHub repo for dependency updates.
- Vercel Firewall (WAF) rules and Bot Protection in the Vercel dashboard.

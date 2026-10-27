# Linkss — feature roadmap

Research done: looked at Linktree's and Liinks' nav menus, feature pages and footers (Oct 2026) to see what's worth copying. Full discussion is in the chat; this file is the saved decision so it doesn't get lost.

## Building now (this round)
- [x] **Link folders** — group related links under a collapsible heading, so long pages stay tidy.
- [x] **QR code** for the published page, generated on the Publish screen.
- [x] **Accent color override** — a creator can pick their own accent color on top of any of the 100 themes, instead of only the theme's default color.

## Worth building later (real features, bigger effort — needs backend/accounts first)
- **Instagram auto-sync**: new IG post → page updates itself. Needs the Instagram API and an approved app.
- **Click/visit analytics**: needs a real database and API routes (everything is local-only right now).
- **Per-element style editor** (fonts, spacing, per-block colors — Liinks' full "Styles" panel). The accent-color override above is a first, smaller step toward this.
- **Affiliate/product marketplace browsing** (like Linktree's Shopify integration). Only worth it once real payments exist.
- **Mailchimp / Shopify / Calendly integrations.** Each needs its own OAuth setup — wait until creators actually ask for them.

## Considered and rejected (for now)
- **20+ free SEO tools** (QR generator, invoice generator, favicon generator, etc. — Liinks' whole footer). This is a real, proven SEO growth channel, but:
  - SEO takes 3–6 months to pay off no matter when you start it.
  - Right now there's no real signup/payment flow, so that traffic has nowhere to convert.
  - 20 tools is 20 small apps to build and maintain.
  - **Revisit once signup + payments are live.** Start with 2–3 only: QR code generator (already added, doubles as this), an Instagram bio-link checker, and an engagement rate calculator.
- **Linktree-style mega nav menu** with a landing page per audience (musicians, coaches, real estate…). Good copy idea, but building 10+ fake-feeling landing pages with nothing behind them yet does more harm than good. Revisit once there's enough real content (testimonials, real pricing per niche) to fill them.

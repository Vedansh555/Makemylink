import { FREE_THEME_IDS } from "@/lib/plans";
export interface Niche {
  slug: string;
  role: string;
  headline: string;
  subhead: string;
  badge: string;
  goal: "bookings" | "products" | "portfolio" | "links";
  benefits: { title: string; desc: string }[];
  faq: { q: string; a: string }[];
}

export const niches: Niche[] = [
  {
    slug: "photographers",
    role: "Photographers & Visual Artists",
    headline: "The aesthetic link in bio for photographers.",
    subhead: "Replace boring text buttons with high-res photo cards, showcase recent client shoots, and take paid portrait bookings with 0% commission.",
    badge: "For Photography & Visual Creators",
    goal: "portfolio",
    benefits: [
      { title: "Bento Grid Visuals", desc: "Show photos in 1x1, 2x1, or 2x2 cards that look like a designer portfolio, not an endless list of text links." },
      { title: "Direct Shoot Bookings", desc: "Let clients pick a date, choose a shoot package, and pay you directly by UPI or card." },
      { title: "Sell Presets & Prints", desc: "Showcase your Lightroom presets or print shop with visual product tiles linking straight to checkout." },
    ],
    faq: [
      { q: "Can I show full-resolution images?", a: "Yes. Cards support uploaded images with aspect ratios optimized for mobile viewports." },
      { q: "How do client shoot bookings work?", a: "Add a booking block with your pricing and calendar slots. Clients book directly and you keep the session fee, minus only the payment company's small charge." },
    ],
  },
  {
    slug: "fitness-coaches",
    role: "Fitness Coaches & Personal Trainers",
    headline: "The high-converting link in bio for fitness coaches.",
    subhead: "Book 1:1 training consultations, share workout plans, and grow your email newsletter from one high-converting mobile page.",
    badge: "For Personal Trainers & Health Coaches",
    goal: "bookings",
    benefits: [
      { title: "1:1 Coaching Calls", desc: "Clients select an available slot on your calendar and pay your fee upfront with zero middleman commission." },
      { title: "Meal & Workout Plans", desc: "Feature your workout guides, PDF downloads, and app links in prominent high-contrast cards." },
      { title: "Email Lead Magnet", desc: "Offer a free 7-day challenge or diet guide to collect verified client emails into your own exportable database." },
    ],
    faq: [
      { q: "Can clients pay in rupees with UPI?", a: "Yes. Connect your own Razorpay and Indian clients can pay by UPI on your page, or share a Razorpay payment link. The money goes to your account." },
      { q: "Can I export my client email list?", a: "Yes. Download your full subscriber list as a CSV at any time to import into any email marketing tool." },
    ],
  },
  {
    slug: "mentors-consultants",
    role: "Mentors, Coaches & Consultants",
    headline: "The 1:1 booking link in bio with zero commission.",
    subhead: "Stop paying 10% to 15% marketplace commissions on every call. Host paid strategy calls, advisory sessions, and resume reviews on your own branded page.",
    badge: "For Consultants, Advisors & Mentors",
    goal: "bookings",
    benefits: [
      { title: "0% Commission on Calls", desc: "0% Showz commission on your consulting fees. A ₹5,000 or $150 session costs you nothing in Showz cuts; only the payment company's fee applies." },
      { title: "Automated Calendar Slots", desc: "Sync your working hours across any time zone. Meeting links (Google Meet, Zoom) are confirmed automatically." },
      { title: "Verified Social Proof", desc: "Include client endorsements, follower metrics, and past speaking engagements directly on your page." },
    ],
    faq: [
      { q: "How is this different from a booking marketplace?", a: "Marketplaces usually take a percentage of each session, which can be worth it when they bring you the client. Showz takes 0% commission: Free includes 3 paid bookings a month and Pro is a flat monthly fee. Payment company fees apply either way, so compare at your own sales level." },
      { q: "How are meeting links delivered?", a: "As soon as you confirm payment in your dashboard, your Google Meet or Zoom link is emailed to the client automatically." },
    ],
  },
  {
    slug: "fashion-creators",
    role: "Fashion & Beauty Influencers",
    headline: "The lookbook link in bio for fashion creators.",
    subhead: "Turn your Instagram OOTD posts into an interactive shopping experience. Feature 20+ outfits with affiliate tags from Amazon, Myntra, LTK, and Nykaa.",
    badge: "For Fashion, Style & Beauty Creators",
    goal: "products",
    benefits: [
      { title: "Shop My Looks Grid", desc: "Visitors can browse your exact outfits with visual photo cards, price tags, and store badges." },
      { title: "Organized Folders", desc: "Group looks by season, brand, or budget (e.g. 'Under ₹1,500' or 'Winter Edits') to keep your link neat." },
      { title: "Dead Link Detection", desc: "Pro automatically checks your affiliate links daily and emails you if a brand URL breaks or goes out of stock." },
    ],
    faq: [
      { q: "Can I add affiliate links from multiple stores?", a: "Yes. Tag products from Amazon, Myntra, Nykaa, ShopMy, LTK, or your own boutique." },
      { q: "Can I add a media kit for brand deals?", a: "Yes. Toggle the built-in media kit block to display your follower counts and engagement rate to brands." },
    ],
  },
  {
    slug: "developers-founders",
    role: "Developers, Designers & Tech Founders",
    headline: "The sleek portfolio & link deck for builders.",
    subhead: "Showcase your GitHub repos, SaaS products, tech stack, and advisory calendar on a minimalist dark-mode Bento page.",
    badge: "For Software Engineers & Tech Founders",
    goal: "portfolio",
    benefits: [
      { title: "Dark-Mode & Monospace Themes", desc: "Choose from minimalist Swiss, Bauhaus, Cyber, and terminal aesthetics crafted for engineers." },
      { title: "Feature Live Projects", desc: "Showcase live demos, Product Hunt launches, and npm packages in clean modular tiles." },
      { title: "Consulting & Code Audits", desc: "Let founders book paid architecture reviews or technical advisory calls directly from your bio." },
    ],
    faq: [
      { q: "Can I use a custom domain?", a: "Yes. Pro users can connect any custom domain (e.g. links.yourname.com or yourname.dev) with automatic SSL." },
      { q: "Is there a free tier?", a: `Yes. Free includes ${FREE_THEME_IDS.length} themes and 8 links forever with no credit card required.` },
    ],
  },
  {
    slug: "podcasters-youtubers",
    role: "Podcasters & Video Creators",
    headline: "The media hub link in bio for video & audio creators.",
    subhead: "Unify your YouTube channel, Spotify episodes, sponsor deals, and fan community into one visual destination.",
    badge: "For Podcasters & YouTubers",
    goal: "links",
    benefits: [
      { title: "Latest Episode Spotlight", desc: "Pin your latest video or podcast episode to a full-width featured card at the very top of your page." },
      { title: "Sponsor & Affiliate Hub", desc: "Group your sponsor discount codes and affiliate links so fans can easily support your show." },
      { title: "Newsletter & Fan Club", desc: "Collect emails directly to notify fans the second a new episode drops, bypassing algorithm drops." },
    ],
    faq: [
      { q: "Can I embed YouTube or Spotify links?", a: "Yes. Add direct links to your latest videos, playlists, or Apple Podcasts." },
      { q: "Can I export fan emails?", a: "Yes. You have 100% ownership of your subscriber list with instant CSV export." },
    ],
  },
];

export const nicheBySlug = (slug: string) => niches.find((n) => n.slug === slug);

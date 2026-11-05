export interface Block {
  h2?: string;
  p?: string[];
  ul?: string[];
}
export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  /** Short direct answer shown first; also used for search and AI answer snippets. */
  answer: string;
  body: Block[];
  faq: { q: string; a: string }[];
}

/**
 * Prices and fees of other products change often. These posts describe how each model works and tell readers to
 * check the current pricing page, instead of quoting numbers that go stale.
 */
export const posts: Post[] = [
  {
    slug: "topmate-alternative-zero-commission",
    title: "Topmate alternative: take bookings without a per-session commission",
    description: "Mentors and consultants who book 1:1 calls through a marketplace pay a cut of every session. Here is how a flat-fee page with its own booking card compares.",
    date: "2026-11-02",
    category: "Comparisons",
    answer: "If you already have an audience, you can take paid 1:1 bookings on your own page for a flat monthly fee and keep 100% of each session, instead of paying a commission to a marketplace on every call.",
    body: [
      { h2: "How marketplace booking pages make money", p: ["Booking marketplaces typically take a percentage of each paid session. That is fair when the marketplace sends you the customer. It is expensive when your own audience on Instagram, LinkedIn or YouTube is the one booking you.", "A percentage also grows with your success: the more you earn, the more you pay, for the same software."] },
      { h2: "What a flat fee changes", p: ["With a flat monthly plan, a ₹3,000 session costs you the same to host as a ₹300 one. Showz Pro is ₹299 a month in India and $8 elsewhere, with 0% commission on bookings."] },
      { h2: "What you need on a booking page", ul: ["Your available days and hours, in your own time zone", "A price per session in rupees or dollars", "Automatic confirmation email with the meeting link", "A page that looks like you, not like every other mentor"] },
      { h2: "How payment works on Showz", p: ["For rupee sessions the buyer pays your UPI ID directly, so the money never passes through us. For dollar sessions you add your own payment link. You confirm payment in your dashboard and the meeting link is emailed to the buyer."] },
      { h2: "When a marketplace is still the better choice", p: ["If you have no audience and want a platform to find you clients, a marketplace's discovery can be worth its commission. Compare current pricing on each site before you decide."] },
    ],
    faq: [
      { q: "Does Showz charge a commission on bookings?", a: "No. Pro is a flat ₹299 per month in India or $8 per month elsewhere, and bookings carry 0% platform commission." },
      { q: "How do buyers pay for a session?", a: "Rupee sessions are paid to your UPI ID. Dollar sessions use a payment link you provide. You confirm payment and the meeting link is emailed automatically." },
    ],
  },
  {
    slug: "bento-me-alternative",
    title: "Bento.me alternative: a designer link-in-bio page that is still here",
    description: "Bento.me was shut down on 13 February 2026 after Linktree acquired it. Here is what to look for in a replacement, and how to move your page in a few minutes.",
    date: "2026-11-02",
    category: "Comparisons",
    answer: "Showz is a link-in-bio builder with Bento-style grid cards and 135 designer themes. You can rebuild a Bento.me page in minutes and start on a free plan.",
    body: [
      { h2: "What people liked about Bento.me", p: ["Bento pages were popular because they looked like a designed portfolio, not a list of buttons: cards of different sizes in a grid."] },
      { h2: "What to look for in a replacement", ul: ["Cards of different sizes (half-width and full-width tiles)", "Themes you can change without rebuilding", "A free plan so you can try before paying", "Export of your email list so you are never locked in"] },
      { h2: "Moving over", p: ["Create an account, pick a theme, and add your links. If you have a Linktree, you can import it from its public page. Pro users can set each card to a half, full or tall tile."] },
      { h2: "Not locked in", p: ["Pro includes a CSV export of everyone who joined your email list, so you can take your audience with you at any time."] },
    ],
    faq: [
      { q: "Is Showz free?", a: "Yes. There is a free plan with 8 links and 10 themes. Pro adds all 135 themes, bookings, grid card sizes, analytics and a custom badge-free page." },
      { q: "Can I import my existing links?", a: "You can import a public Linktree page by pasting its address. Other links can be added by hand." },
    ],
  },
  {
    slug: "best-link-in-bio-tools-india",
    title: "Best link-in-bio tools for Indian creators in 2026",
    description: "What matters when you choose a link-in-bio tool in India: UPI payments, rupee pricing, bookings and how the tool treats your audience data.",
    date: "2026-11-02",
    category: "Guides",
    answer: "Choose a link-in-bio tool by what it lets you earn: UPI-friendly bookings, rupee pricing, your own email list and no commission on your sales. Design matters, but it is the second filter.",
    body: [
      { h2: "1. Can you get paid the way Indians pay?", p: ["UPI is how most Indian customers pay. A tool that only supports international cards will lose you sales."] },
      { h2: "2. Is the price in rupees?", p: ["Dollar pricing is a real cost for a small creator once exchange rates and card fees are added. Check whether the plan is billed in INR."] },
      { h2: "3. Who owns your email list?", p: ["Your subscribers are your business. Look for a plan that lets you export them."] },
      { h2: "4. Fees on your sales", p: ["Some tools take a percentage of what you sell on lower plans. Read the pricing page for the plan you will actually use."] },
      { h2: "5. Does it look like you?", p: ["Themes and layout matter, especially for fashion, beauty and photography creators."] },
      { h2: "Where Showz fits", p: ["Showz has rupee pricing (₹299 per month for Pro), UPI-paid bookings, a real email list with CSV export, and 135 themes. The free plan is enough to start."] },
    ],
    faq: [
      { q: "What is the best link-in-bio tool for Indian creators?", a: "The best tool is the one that supports UPI, bills in rupees, lets you export your audience and does not take a commission on your sales. Showz is built around those four points." },
    ],
  },
  {
    slug: "link-in-bio-for-fashion-creators",
    title: "Link in bio for fashion creators: how to show 20 looks without 20 buttons",
    description: "A practical layout for fashion and beauty creators who share many affiliate links: product grids, folders and what to put first.",
    date: "2026-11-02",
    category: "Guides",
    answer: "Put your newest or best-converting look first, show products as a photo grid instead of a button list, and group older links into folders.",
    body: [
      { h2: "Use a product grid, not buttons", p: ["People buy what they can see. A grid of photos with the store and price beats twenty identical text buttons."] },
      { h2: "Group the long tail", p: ["Use folders for things like 'Winter edit' or 'Under ₹1,500' so the page stays short."] },
      { h2: "Schedule drops", p: ["Set a start and end time on a link so a sale or a collab goes live on time and disappears when it ends."] },
      { h2: "Keep affiliate links alive", p: ["Brands change URLs. A daily broken-link check on Pro emails you when a link stops working so you do not lose commission."] },
      { h2: "Add a media kit", p: ["Brands look for follower counts, engagement and past collaborations. A media kit block on your page saves you the PDF."] },
    ],
    faq: [
      { q: "How many links should a fashion creator have?", a: "Keep the top of the page to a few strong items and move the rest into a product grid and folders." },
    ],
  },
  {
    slug: "add-booking-to-instagram-bio",
    title: "How to take paid bookings from your Instagram bio",
    description: "Step by step: set up a bookable 1:1 session on a link-in-bio page so followers can pick a time and pay.",
    date: "2026-11-02",
    category: "How-to",
    answer: "Use a link-in-bio page with a booking card: set your days, hours, price and meeting link, then put that one page link in your Instagram bio.",
    body: [
      { h2: "Step 1: Create your page", p: ["Sign up, choose a handle and a theme."] },
      { h2: "Step 2: Add a booking card (Pro)", p: ["In the editor choose 'Add booking'. Set a title, the price, the length, your days and hours, your time zone, your meeting link and your UPI ID."] },
      { h2: "Step 3: Share one link", p: ["Put your page link in your Instagram, LinkedIn and YouTube bios. Visitors pick a time, enter their email and pay."] },
      { h2: "Step 4: Confirm and meet", p: ["You get an email for each booking. Mark it paid in your dashboard and the buyer receives the meeting link."] },
    ],
    faq: [
      { q: "Do I need a business account to take bookings?", a: "No. For rupee sessions buyers pay your personal or business UPI ID directly." },
    ],
  },
  {
    slug: "linktree-fees-explained",
    title: "Link-in-bio fees explained: subscription vs commission",
    description: "Link-in-bio tools charge in two ways: a monthly subscription, a cut of your sales, or both. Here is how to compare them.",
    date: "2026-11-02",
    category: "Guides",
    answer: "Compare the total cost at your own sales level: monthly price plus any percentage the tool keeps, plus payment-processor fees. A flat fee is cheaper once you sell regularly.",
    body: [
      { h2: "Two ways tools charge", ul: ["Subscription: a flat monthly or yearly price", "Commission: a percentage of each sale", "Many tools mix both depending on the plan"] },
      { h2: "A quick way to compare", p: ["Take your realistic monthly sales. Work out: the plan price, plus the percentage cut times your sales, plus the payment processor's own fee. Compare that number across tools. Check each tool's own pricing page, because plans change."] },
      { h2: "Our model", p: ["Free to start. Pro is ₹299 per month in India or $8 elsewhere, with no commission on bookings or sales. Payment processors still charge their own fees where they apply."] },
    ],
    faq: [
      { q: "Is a flat fee or a commission cheaper?", a: "If you sell regularly, a flat fee is usually cheaper because a commission grows with your sales. If you rarely sell, a free plan or commission can cost less. Compare at your own sales level." },
    ],
  },
];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);

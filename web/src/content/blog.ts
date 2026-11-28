import { FREE_THEME_IDS } from "@/lib/plans";
import { themeList } from "@/lib/themes";
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
    slug: "paid-calls-without-commission",
    title: "Take paid 1:1 calls without a per-session commission",
    description: "Mentors and consultants who book 1:1 calls through a marketplace pay a cut of every session. Here is how a flat-fee page with its own booking card compares.",
    date: "2026-11-02",
    category: "Comparisons",
    answer: "If you already have an audience, you can take paid 1:1 bookings on your own page for a flat monthly fee and keep each session's fee, minus only the payment company's small charge, instead of paying a commission to a marketplace on every call.",
    body: [
      { h2: "How marketplace booking pages make money", p: ["Booking marketplaces typically take a percentage of each paid session. That is fair when the marketplace sends you the customer. It is expensive when your own audience on Instagram, LinkedIn or YouTube is the one booking you.", "A percentage also grows with your success: the more you earn, the more you pay, for the same software."] },
      { h2: "What a flat fee changes", p: ["With a flat monthly plan, a ₹3,000 session costs you the same to host as a ₹300 one. Showz Pro is ₹299 a month in India and $8 elsewhere, with 0% commission on bookings."] },
      { h2: "What you need on a booking page", ul: ["Your available days and hours, in your own time zone", "A price per session in rupees or dollars", "Automatic confirmation email with the meeting link", "A page that looks like you, not like every other mentor"] },
      { h2: "How payment works on Showz", p: ["Buyers pay you directly, so the money never passes through us. Connect your own Razorpay (rupees, including UPI) or PayPal (dollars) and bookings confirm by themselves, or add your payment link and confirm each payment in your dashboard. The meeting link is then emailed to the buyer."] },
      { h2: "When a marketplace is still the better choice", p: ["If you have no audience and want a platform to find you clients, a marketplace's discovery can be worth its commission. Compare current pricing on each site before you decide."] },
    ],
    faq: [
      { q: "Does Showz charge a commission on bookings?", a: "No. Pro is a flat ₹299 per month in India or $8 per month elsewhere, and bookings carry 0% platform commission." },
      { q: "How do buyers pay for a session?", a: "Through your own Razorpay or PayPal, which confirms the booking automatically, or through your payment link, which you confirm. The meeting link is emailed to the buyer." },
    ],
  },
  {
    slug: "card-grid-link-in-bio",
    title: "A card-grid link-in-bio page you own",
    description: "What to look for in a designer card-grid page, and how to make sure you never lose your page or your audience if a tool closes.",
    date: "2026-11-02",
    category: "Comparisons",
    answer: `Showz is a link-in-bio builder with grid cards and ${themeList.length} designer themes. You can set up a page in minutes, start on a free plan, and download your data any time.`,
    body: [
      { h2: "Why people like card grids", p: ["A card grid looks like a designed portfolio, not a list of buttons: cards of different sizes, so the most important one stands out."] },
      { h2: "What to look for", ul: ["Cards of different sizes (half-width and full-width tiles)", "Themes you can change without rebuilding", "A free plan so you can try before paying", "Export of your email list so you are never locked in"] },
      { h2: "Moving over", p: ["Create an account, pick a theme, and add your links. If you already have a link page, paste its public address to import it. Pro users can set each card to a half, full or tall tile."] },
      { h2: "Not locked in", p: ["Pro includes a CSV export of everyone who joined your email list, so you can take your audience with you at any time."] },
    ],
    faq: [
      { q: "Is Showz free?", a: `Yes. There is a free plan with 8 links and ${FREE_THEME_IDS.length} themes. Free also includes 3 paid bookings a month. Pro adds all ${themeList.length} themes, unlimited bookings, grid card sizes, analytics and a badge-free page.` },
      { q: "Can I import my existing links?", a: "Yes. Paste the public address of your current link page to import it. Anything missing can be added by hand." },
    ],
  },
  {
    slug: "button-list-vs-card-grid",
    title: "Button list or card grid: which link-in-bio layout fits you?",
    description: "A plain vertical list of buttons against a grid of mixed-size cards: how visual hierarchy and mobile layout differ, and how to choose.",
    date: "2026-11-04",
    category: "Comparisons",
    answer: "A card grid lets one main link stand out and can show pictures, bookings and products, while a plain list is simpler. Pick the grid if you have one clear main action, and the list if you only have a few links. We have no click-rate numbers to quote, so try both on your own page.",
    body: [
      { h2: "The problem with vertical button lists", p: ["For years, link-in-bio meant one thing: a centered avatar on top of fifteen stacked rectangular buttons. Every button looked identical, forcing visitors to read every line of text to find what they wanted.", "On a small screen, links far down a long list are easy to miss."] },
      { h2: "Why a card grid can read better on mobile", p: ["A card grid organizes links into modules: small half-width cards for quick links, full-width cards for a booking or a lead magnet, and tall cards for a featured product or video.", "This creates natural visual hierarchy. Your primary call-to-action—like booking a consultation or your newest YouTube video—commands immediate attention without scrolling."] },
      { h2: "Feature comparison: button list vs card grid", ul: ["Visual hierarchy: a plain list treats every link the same; a card grid lets you make one card bigger and add a picture", "Bookings and products: on Showz a card can be a bookable session or a product photo, right in the grid", `Looks: Showz cards work in all ${themeList.length} designer themes, and you can change the theme any time`] },
      { h2: "When to stick with a simple button list", p: ["If you only have two or three basic links (like a website and a contact form) and no products or bookings, a simple list is sufficient. But for creators with an active audience who sell services or recommend products, a card grid with one clear main card usually reads better."] },
    ],
    faq: [
      { q: "Do card grids with pictures load slower than a plain list?", a: "Pictures add some weight, so Showz shrinks the pictures you upload to a small size. Keep to a few pictures if speed matters most." },
      { q: "Can I switch to a card grid without starting from scratch?", a: "Yes. Paste the public address of your current link page and Showz imports your picture, links and social icons." },
    ],
  },
  {
    slug: "creator-store-vs-booking-page",
    title: "Full creator store or a simple booking page?",
    description: "Full creator stores bundle courses, downloads and email tools. Here is when a page with paid bookings, at ₹299 or $8 a month, is all you need.",
    date: "2026-11-04",
    category: "Comparisons",
    answer: "If you sell courses and downloads, a full creator store may suit you. If you mainly take paid 1:1 calls, a simpler page with 0% commission usually costs less. Compare at your own sales level.",
    body: [
      { h2: "What each one is built for", p: ["Full creator stores bundle a storefront, digital products, courses, email tools and bookings in one place, usually at a higher monthly price. Check each tool's own pricing page.", "Showz is built around a designed link page with paid 1:1 bookings, product links and an email list."] },
      { h2: "Differences at a glance", ul: ["Price: Showz is free to start (3 paid bookings a month); Pro is ₹299 a month in India or $8 elsewhere", `Design: Showz has ${themeList.length} themes and cards in mixed sizes`, "Payments: on Showz buyers pay you directly through your own Razorpay (rupees, including UPI) or PayPal, or your payment link; Showz takes 0% commission"] },
      { h2: "Which one should you choose?", p: ["If you sell courses, digital downloads and need built-in email tools, a full creator store may suit you better. If you mainly take paid calls and want a designed page at a lower monthly price, Showz may fit. Payment company fees apply on both."] },
    ],
    faq: [
      { q: "Does Showz charge a percentage of my bookings?", a: "No. Showz charges 0% commission on bookings and sales on both Free and Pro plans." },
      { q: "How do Indian creators receive booking payments?", a: "Clients pay into your own Razorpay account (UPI, cards or netbanking) or your payment link. Showz never holds the money; your payment company settles it to your bank." },
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
      { h2: "Where Showz fits", p: [`Showz has rupee pricing (₹299 per month for Pro), bookings paid by UPI or card through your own Razorpay, a real email list with CSV export, and ${themeList.length} themes. The free plan is enough to start.`] },
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
      { h2: "Step 2: Add a booking card (Pro)", p: ["In the editor choose 'Add booking'. Set a title, the price, the length, your days and hours, your time zone, your meeting link, then connect Razorpay or PayPal or add your payment link."] },
      { h2: "Step 3: Share one link", p: ["Put your page link in your Instagram, LinkedIn and YouTube bios. Visitors pick a time, enter their email and pay."] },
      { h2: "Step 4: Confirm and meet", p: ["You get an email for each booking. Mark it paid in your dashboard and the buyer receives the meeting link."] },
    ],
    faq: [
      { q: "Do I need a business account to take bookings?", a: "You can take bookings with a payment link. To have them confirm automatically, you need your own Razorpay or PayPal account." },
    ],
  },
  {
    slug: "link-in-bio-fees-explained",
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

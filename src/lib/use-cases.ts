export type UseCase = {
  slug: string;
  label: string;
  headline: string;
  subhead: string;
  intro: string;
  benefits: { title: string; body: string }[];
  steps: string[];
  faqs: { q: string; a: string }[];
};

export const useCases: UseCase[] = [
  {
    slug: "saas",
    label: "SaaS",
    headline: "Referral programs for SaaS companies",
    subhead: "Turn happy users into your highest-converting acquisition channel.",
    intro:
      "SaaS growth compounds when your existing users invite their peers. Referrals.com makes it simple to launch double-sided reward campaigns, track every share, and reward users automatically — no engineering sprint required.",
    benefits: [
      { title: "Lower CAC", body: "Referred users convert higher and churn less, cutting your blended acquisition cost." },
      { title: "In-product widgets", body: "Drop a referral widget into your app or onboarding in minutes." },
      { title: "Automated rewards", body: "Trigger credits, discounts, or custom rewards the moment a referral converts." },
    ],
    steps: [
      "Connect your product domain",
      "Pick a double-sided reward (credits, discount, or cash)",
      "Embed the widget in-app and share the campaign link",
      "Track shares, conversions, and rewards in real time",
    ],
    faqs: [
      { q: "Can I reward account credits?", a: "Yes — set custom reward rules that fire on conversion, including account credits, discounts, or cash." },
      { q: "Does it work with our onboarding flow?", a: "Absolutely. Embed the widget anywhere with a snippet, or trigger invites via the API." },
    ],
  },
  {
    slug: "ecommerce",
    label: "Ecommerce",
    headline: "Referral programs for ecommerce brands",
    subhead: "Reward customers for bringing their friends — and watch AOV climb.",
    intro:
      "Give shoppers a reason to share. With Referrals.com you can launch give-$10-get-$10 campaigns, coupon rewards, and gamified contests that turn one purchase into many.",
    benefits: [
      { title: "Give-get coupons", body: "Issue unique discount codes to both referrer and friend automatically." },
      { title: "Shopify-ready", body: "Connect your store and sync rewards without custom code." },
      { title: "Gamified contests", body: "Run leaderboards and milestone rewards to drive repeat sharing." },
    ],
    steps: [
      "Connect your store domain",
      "Choose a give-get coupon or cashback reward",
      "Add the widget to your post-purchase and account pages",
      "Watch referred orders roll in",
    ],
    faqs: [
      { q: "Can I issue unique coupon codes?", a: "Yes — upload a coupon pool or generate codes, delivered automatically to referrer and friend." },
      { q: "Does it integrate with Shopify?", a: "Yes, connect your store and reward referred purchases without custom development." },
    ],
  },
  {
    slug: "agencies",
    label: "Agencies",
    headline: "Referral programs for agencies",
    subhead: "Run referral campaigns for every client from one dashboard.",
    intro:
      "Manage referral programs across all your clients with per-domain billing that scales with your book of business. Every client gets the full feature set — you only pay $9/month per additional domain.",
    benefits: [
      { title: "Multi-client", body: "Spin up a fully-featured program per client domain in minutes." },
      { title: "White-label ready", body: "Remove Referrals.com branding on paid domains for a clean client experience." },
      { title: "Transparent pricing", body: "$9/month per domain — no per-seat fees, no tiers to explain to clients." },
    ],
    steps: [
      "Add each client as its own domain",
      "Launch tailored campaigns per brand",
      "Optionally white-label the widgets",
      "Report on results with built-in analytics",
    ],
    faqs: [
      { q: "How does billing work for multiple clients?", a: "Each client domain is a simple $9/month subscription — add or cancel as your roster changes." },
      { q: "Can I remove your branding?", a: "Yes, paid domains support white-label widgets and public pages." },
    ],
  },
  {
    slug: "creators",
    label: "Creators",
    headline: "Referral programs for creators & communities",
    subhead: "Grow your audience by rewarding your biggest fans for sharing.",
    intro:
      "Whether you run a newsletter, community, or content brand, Referrals.com helps you turn your audience into a growth engine with milestone rewards, leaderboards, and viral share mechanics.",
    benefits: [
      { title: "Milestone rewards", body: "Reward fans for hitting share and referral milestones." },
      { title: "Leaderboards", body: "Add friendly competition that keeps your community sharing." },
      { title: "Every channel", body: "One-tap sharing to every major social platform." },
    ],
    steps: [
      "Connect your site or landing page",
      "Set milestone or leaderboard rewards",
      "Share your campaign link with your audience",
      "Watch your reach multiply",
    ],
    faqs: [
      { q: "Do I need a website?", a: "You can use a landing page — connect any domain you control to get started free." },
      { q: "Can fans compete on a leaderboard?", a: "Yes, leaderboards and milestone rewards are included on every plan." },
    ],
  },
  {
    slug: "startups",
    label: "Startups",
    headline: "Referral programs for startups",
    subhead: "Launch a word-of-mouth engine before you spend a dollar on ads.",
    intro:
      "Early traction comes from people telling people. Get a fully-featured referral program live for free, prove the channel, and only pay as you scale to more products and domains.",
    benefits: [
      { title: "Free to launch", body: "Your first campaign and domain are free — every feature included." },
      { title: "Fast setup", body: "Go live in an afternoon with templates and embeddable widgets." },
      { title: "Scale later", body: "Add domains for $9/month each as you launch new products." },
    ],
    steps: [
      "Sign up and connect your domain",
      "Pick a template and set your reward",
      "Embed the widget or share your link",
      "Measure what works, then scale",
    ],
    faqs: [
      { q: "Is it really free to start?", a: "Yes — your first campaign on your first domain is free forever, with no feature gates." },
      { q: "What happens when we grow?", a: "Add more domains for $9/month each. Cancel anytime, month to month." },
    ],
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return useCases.find((u) => u.slug === slug);
}

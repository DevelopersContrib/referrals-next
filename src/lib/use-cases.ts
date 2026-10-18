/**
 * Audience landing pages: /referral-program-for/{slug}.
 *
 * Each page is written for one kind of business: its own reward example,
 * what triggers the reward, simple break-even math, and the templates that
 * fit. Keep claims to what the product does today; examples are labelled
 * as examples, never as customer results.
 */
export type UseCase = {
  slug: string;
  /** Short name for chips, nav and the homepage picker. */
  label: string;
  /** Search title (≤ 60 chars) and description (≤ 155 chars). */
  metaTitle: string;
  metaDescription: string;
  headline: string;
  subhead: string;
  intro: string;
  /** A ready-to-copy reward for this audience. */
  offer: { give: string; get: string; trigger: string };
  /** One-line worked example of why the reward pays for itself. */
  math: string;
  benefits: { title: string; body: string }[];
  steps: string[];
  /** Slugs from /campaign-templates that fit this audience. */
  templates: string[];
  faqs: { q: string; a: string }[];
};

const PUBLISH_STEP = "Publish your brand for $9/mo and your program goes live";

export const useCases: UseCase[] = [
  {
    slug: "saas",
    label: "SaaS",
    metaTitle: "SaaS Referral Program Software — $9/mo per Brand",
    metaDescription:
      "Launch a SaaS referral program with in-app widgets, account-credit rewards and tracked invite links. Set up free, $9/mo when it goes live.",
    headline: "A referral program your users will actually use",
    subhead:
      "Reward users with account credit when the friends they invite become paying customers.",
    intro:
      "Your best users already recommend you in Slack threads and team meetings. A referral program gives them a link to share and a reason to share it, and pays out only when a referral turns into revenue.",
    offer: {
      give: "Friend gets their first month free",
      get: "Referrer gets 1 month of account credit",
      trigger: "Reward fires when the friend's first payment goes through",
    },
    math: "Example: on a $29/mo plan, one referred customer who stays a year is $348 of revenue for a $29 credit.",
    benefits: [
      {
        title: "Pay for results, not clicks",
        body: "Set the goal to signups, not visits, so rewards fire only when a referral actually creates an account.",
      },
      {
        title: "In-app widget",
        body: "Paste one snippet into your app or onboarding. Users see their link, their invites and their rewards in one place.",
      },
      {
        title: "Fits your stack",
        body: "Send referral signups to your CRM or billing tool through the API or Zapier, no engineering sprint needed.",
      },
    ],
    steps: [
      "Set up your brand and pick a double-sided reward",
      "Choose a template and match it to your app's look",
      PUBLISH_STEP,
      "Add the widget in-app and track invites, signups and rewards",
    ],
    templates: ["closed-beta", "info-bar", "full-page"],
    faqs: [
      {
        q: "Can I reward account credit instead of cash?",
        a: "Yes. The reward is whatever you choose: account credit, a free month, a discount code or cash. You decide what fires it.",
      },
      {
        q: "Can I trigger rewards from our own backend?",
        a: "Yes. Record signups through the REST API or Zapier, so the reward can wait until a trial converts to paid.",
      },
      {
        q: "What does it cost?",
        a: "Setting up is free. Publishing a brand is $9/mo (or $99/yr). Cancel anytime and the program goes back to private.",
      },
    ],
  },
  {
    slug: "ecommerce",
    label: "Ecommerce",
    metaTitle: "Ecommerce Referral Program — Give $10, Get $10",
    metaDescription:
      "Turn every order into the next customer with a give-$10-get-$10 referral program. Coupon rewards, post-purchase sharing, $9/mo per store.",
    headline: "Turn every order into your next customer",
    subhead:
      "Give shoppers a discount to share. When their friend places a first order, both of them get rewarded.",
    intro:
      "A happy customer right after checkout is the easiest moment to ask for a referral. Referrals.com gives them a share link and a reward, and hands their friend a discount that gets the first order over the line.",
    offer: {
      give: "Friend gets $10 off their first order",
      get: "Customer gets $10 off their next order",
      trigger: "Reward fires on the friend's first order",
    },
    math: "Example: with a $60 average order and 50% margin, a referred order earns $30 against $20 in discounts, before any repeat orders.",
    benefits: [
      {
        title: "Coupon rewards",
        body: "Hand out discount codes automatically, from a single code or a pool of unique codes.",
      },
      {
        title: "Ask at the right moment",
        body: "Place the widget on your thank-you page and order emails, when customers are happiest.",
      },
      {
        title: "See what sells",
        body: "Track shares, clicks and first orders by referrer, so you know who your best advocates are.",
      },
    ],
    steps: [
      "Set up your store as a brand and choose give-and-get coupon amounts",
      "Pick a template for your thank-you page",
      PUBLISH_STEP,
      "Share the link in order emails and watch first orders come in",
    ],
    templates: ["social-instant", "info-bar", "download-giveaway"],
    faqs: [
      {
        q: "Does it work with Shopify?",
        a: "Yes. Connect your store from Integrations → Shopify, or paste the widget snippet into your theme. See our Shopify page for details.",
      },
      {
        q: "Can each customer get a unique code?",
        a: "Yes. Upload a pool of discount codes and each reward uses the next one.",
      },
      {
        q: "What does it cost?",
        a: "Set up free. Publishing your store is $9/mo (or $99/yr), with no per-order fees.",
      },
    ],
  },
  {
    slug: "shopify",
    label: "Shopify stores",
    metaTitle: "Shopify Referral Program App Alternative — $9/mo",
    metaDescription:
      "Add a referral program to your Shopify store: connect in a few clicks, reward first orders with discount codes. $9/mo per store, no per-order fees.",
    headline: "A Shopify referral program for $9 a month",
    subhead:
      "Connect your store, reward first orders with discount codes, and skip the per-order fees.",
    intro:
      "Most Shopify referral apps charge more as you grow. Referrals.com is a flat $9/mo per store: connect it, set a give-and-get discount, and let customers share from your thank-you page.",
    offer: {
      give: "Friend gets 15% off their first order",
      get: "Customer gets a $10 store credit code",
      trigger: "Reward fires on the friend's first order",
    },
    math: "Example: one referred first order a month at a $60 average more than covers the $9 plan.",
    benefits: [
      {
        title: "Connect in a few clicks",
        body: "Link your store from Integrations → Shopify, or paste the widget snippet into your theme if you prefer.",
      },
      {
        title: "Discount codes as rewards",
        body: "Use one code or a pool of unique codes created in Shopify.",
      },
      {
        title: "Flat price",
        body: "$9/mo per store. No per-order fees and no revenue share.",
      },
    ],
    steps: [
      "Create your account and connect your Shopify store",
      "Set the friend discount and the customer reward",
      PUBLISH_STEP,
      "Add the widget to your thank-you page and order emails",
    ],
    templates: ["social-instant", "info-bar", "full-page"],
    faqs: [
      {
        q: "Do I need a developer?",
        a: "No. Connect your store, or paste one snippet into your theme.",
      },
      {
        q: "Is there a per-order fee?",
        a: "No. It's $9/mo per store (or $99/yr), whatever your order volume.",
      },
      {
        q: "Can I try it before paying?",
        a: "Yes. Set up your store and campaign free. You pay when you publish it so customers can join.",
      },
    ],
  },
  {
    slug: "local-business",
    label: "Local businesses",
    metaTitle: "Referral Program for Local Businesses — $9/mo",
    metaDescription:
      "Get more customers from word of mouth. A simple referral program for salons, dentists, gyms and home services, with rewards you already offer.",
    headline: "Get more customers from word of mouth",
    subhead:
      "For salons, clinics, gyms and home services: reward the customers who send their friends to you.",
    intro:
      "Most local businesses already grow by word of mouth, but nobody tracks it and nobody gets thanked. Give every customer a link to share and a reward they care about, and see exactly who sends you new business.",
    offer: {
      give: "Friend gets 20% off their first visit",
      get: "Customer gets a free add-on or $20 credit",
      trigger: "Reward fires when the friend books or signs up",
    },
    math: "Example: if a new client is worth $150 a year, one referral a month is about $1,800 a year for a $9/mo program.",
    benefits: [
      {
        title: "Rewards you already offer",
        body: "A free add-on, a discount or a credit. No cash payouts needed.",
      },
      {
        title: "Works without a big website",
        body: "Share your program page by text, email, QR code at the counter or on your booking page.",
      },
      {
        title: "Know who sends you business",
        body: "See which customers bring friends in, so you can thank them personally.",
      },
    ],
    steps: [
      "Set up your business and choose a reward",
      "Pick a simple template for your program page",
      PUBLISH_STEP,
      "Share the link by text, email and a QR code in your shop",
    ],
    templates: ["info-bar", "social-instant", "poll-campaign"],
    faqs: [
      {
        q: "Who is this for?",
        a: "Salons, spas, dentists, clinics, gyms, studios, cleaners, contractors and any business that grows by recommendation.",
      },
      {
        q: "Do I need a website?",
        a: "It helps, but your program also has its own page you can share by link or QR code.",
      },
      {
        q: "What does it cost?",
        a: "Set up free. $9/mo (or $99/yr) when you publish. Cancel anytime.",
      },
    ],
  },
  {
    slug: "agencies",
    label: "Agencies",
    metaTitle: "Referral Program Software for Agencies & Resellers",
    metaDescription:
      "Run referral programs for every client from one dashboard. Whitelabel widgets, $9/mo per client brand that you can mark up.",
    headline: "Run referral programs for every client",
    subhead:
      "One dashboard for all your client brands. Whitelabel widgets, simple per-brand pricing you can mark up.",
    intro:
      "Referral programs are an easy add-on to sell: clients understand them and the results are tracked. Set each client up as a brand, launch from templates, and bill them your own price.",
    offer: {
      give: "Client's customer gets a first-order discount",
      get: "Client's referrer gets a reward of the client's choice",
      trigger: "You set the trigger per client: signup, booking or first order",
    },
    math: "Example: sell a referral program at $49/mo per client; your cost is $9/mo per brand.",
    benefits: [
      {
        title: "Every client in one place",
        body: "Switch between client brands, campaigns and results from one account.",
      },
      {
        title: "Whitelabel",
        body: "Published brands show your client's branding, not ours.",
      },
      {
        title: "Simple per-brand billing",
        body: "$9/mo per client brand. Running 10 or more? Ask us about agency pricing.",
      },
    ],
    steps: [
      "Add each client as a brand",
      "Launch from a template and match the client's look",
      "Publish each client brand for $9/mo",
      "Report shares, signups and rewards back to your client",
    ],
    templates: ["full-page", "social-instant", "closed-beta"],
    faqs: [
      {
        q: "Can I resell it under my own name?",
        a: "Yes. Published brands are whitelabel, and you set your own price to clients.",
      },
      {
        q: "Is there agency pricing?",
        a: "Each client brand is $9/mo. If you run 10 or more client brands, contact us about agency pricing.",
      },
      {
        q: "Can clients log in?",
        a: "You manage the programs from your account and share results with clients.",
      },
    ],
  },
  {
    slug: "newsletters",
    label: "Newsletters",
    metaTitle: "Newsletter Referral Program — Reward Subscribers",
    metaDescription:
      "Grow your newsletter with a referral program: subscribers share a link and unlock rewards at milestones. Set up free, $9/mo when it goes live.",
    headline: "Grow your newsletter with your readers",
    subhead:
      "Readers share their link and unlock rewards as their friends subscribe.",
    intro:
      "The fastest-growing newsletters turn readers into recruiters with milestone rewards. Add a referral block to every issue and let your audience do the growing.",
    offer: {
      give: "Friend gets your newsletter and a welcome bonus",
      get: "Reader unlocks rewards at 1, 3 and 10 referrals",
      trigger: "Reward fires when the friend subscribes",
    },
    math: "Example: if 5% of 2,000 readers each bring one friend, that's 100 new subscribers a month for $9.",
    benefits: [
      {
        title: "Milestone rewards",
        body: "A shout-out at 1, a bonus issue at 3, a sticker pack or free month at 10. You choose.",
      },
      {
        title: "Leaderboards",
        body: "Show your top recruiters to turn sharing into a game.",
      },
      {
        title: "Works with your email tool",
        body: "Put each reader's link in your issue footer, and send new subscribers on through Zapier or the API.",
      },
    ],
    steps: [
      "Set up your newsletter as a brand and choose milestone rewards",
      "Pick a template for your signup page",
      PUBLISH_STEP,
      "Add the referral link to every issue and track your leaderboard",
    ],
    templates: ["social-instant", "poll-campaign", "download-giveaway"],
    faqs: [
      {
        q: "Does it work with my email platform?",
        a: "Yes, by link: add each reader's referral link to your issue. To sync subscribers automatically, use Zapier or the API.",
      },
      {
        q: "What rewards work best?",
        a: "Small, exclusive ones: shout-outs, bonus content, stickers or a free month of a paid tier.",
      },
      {
        q: "What does it cost?",
        a: "Set up free. $9/mo (or $99/yr) when you publish.",
      },
    ],
  },
  {
    slug: "creators",
    label: "Creators",
    metaTitle: "Referral Program for Creators, Coaches & Communities",
    metaDescription:
      "Reward fans and members who bring friends to your course, community or membership. Leaderboards, giveaways and tracked links for $9/mo.",
    headline: "Let your fans grow your community",
    subhead:
      "For courses, memberships and communities: reward the members who bring their friends.",
    intro:
      "Your audience trusts you, and they trust each other even more. Give your members a link, a leaderboard and a reason to invite, and turn launches into group events.",
    offer: {
      give: "Friend gets a free lesson or trial week",
      get: "Member gets a bonus session, merch or a discount",
      trigger: "Reward fires when the friend signs up",
    },
    math: "Example: on a $30/mo membership, three referred members a month adds $90 in monthly revenue for $9.",
    benefits: [
      {
        title: "Giveaways and leaderboards",
        body: "Run launch contests that reward your top recruiters.",
      },
      {
        title: "A page to share",
        body: "Your program has its own page, so members can share it anywhere.",
      },
      {
        title: "Rewards your fans want",
        body: "Bonus content, shout-outs, merch or early access.",
      },
    ],
    steps: [
      "Set up your community or course as a brand",
      "Pick a giveaway or leaderboard template",
      PUBLISH_STEP,
      "Share it with your audience and reward your top recruiters",
    ],
    templates: ["photo-voting", "download-giveaway", "social-instant"],
    faqs: [
      {
        q: "Do I need my own website?",
        a: "Your program gets its own shareable page, and you can also embed it on your site.",
      },
      {
        q: "Can I run a contest?",
        a: "Yes. Use a leaderboard or voting template and reward the top recruiters.",
      },
      {
        q: "What does it cost?",
        a: "Set up free. $9/mo (or $99/yr) when you publish.",
      },
    ],
  },
  {
    slug: "startups",
    label: "Startups",
    metaTitle: "Waitlist Referral Program for Startups & Launches",
    metaDescription:
      "Build a viral waitlist before launch: people move up the list for every friend they invite. Set up free, $9/mo when it goes live.",
    headline: "Launch with a waitlist that grows itself",
    subhead:
      "People move up the list for every friend they invite, before you spend a dollar on ads.",
    intro:
      "A referral waitlist turns launch interest into a sharing loop. Early fans get earlier access by inviting friends, and you launch with a list instead of an empty room.",
    offer: {
      give: "Friend joins the waitlist",
      get: "Inviter moves up the list and unlocks early access",
      trigger: "Reward fires when the friend joins",
    },
    math: "Example: if each of your first 200 signups invites just one friend, you launch to 400.",
    benefits: [
      {
        title: "Waitlist built in",
        body: "The Closed Beta template handles signups, invites and early-access rewards.",
      },
      {
        title: "Know your early fans",
        body: "See who brings the most friends, and invite them first.",
      },
      {
        title: "Cheap to run",
        body: "$9/mo while you launch, cancel anytime.",
      },
    ],
    steps: [
      "Set up your product as a brand",
      "Start from the Closed Beta waitlist template",
      PUBLISH_STEP,
      "Share the waitlist link and invite your top referrers first",
    ],
    templates: ["closed-beta", "full-page", "info-bar"],
    faqs: [
      {
        q: "Can I use it before my product exists?",
        a: "Yes. A waitlist only needs a page and a signup form, which the template gives you.",
      },
      {
        q: "What happens after launch?",
        a: "Switch the campaign to a regular double-sided reward and keep growing.",
      },
      {
        q: "What does it cost?",
        a: "Set up free. $9/mo (or $99/yr) when you publish.",
      },
    ],
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return useCases.find((u) => u.slug === slug);
}

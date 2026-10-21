// Relative so vitest (no @ alias) can load this file directly.
import { canonicalOrigin } from "./site-url";

/**
 * Referral network clones: our own referral-themed domains (referrals.net,
 * referralprogram.com, ...) served by this app with their own name, logo,
 * colors and landing pages. src/proxy.ts maps the host to a site here and
 * rewrites its few public pages to /network/{key}. Everything else (sign-in,
 * sign-up, dashboard, billing) redirects to referrals.com, so accounts never
 * live on a clone. Sign-ups are credited to the clone through /go?ref=<domain>.
 *
 * Adding a clone = one entry below. It is only served on its real domain once
 * `enabled` is true; locally it always works at http://{key}.localhost:3000.
 *
 * Kept free of prisma imports: the proxy reads it on every request.
 */

/** Request header the proxy sets on a rewrite, so pages know they're on a clone host. */
export const NETWORK_SITE_HEADER = "x-network-site";

export type NetworkPage = "home" | "how-it-works" | "pricing";

/**
 * Three looks for a clone's pages:
 *   studio     - dark and product-first, the showcase is the hero
 *   storefront - warm and friendly, the showcase sits in a website frame
 *   poster       - bold condensed type on a solid color block
 *   professional - calm and polished for business buyers, serif headlines
 */
export const NETWORK_DESIGNS = ["studio", "storefront", "poster", "professional"] as const;
export type NetworkDesign = (typeof NETWORK_DESIGNS)[number];

export function isNetworkDesign(value: string | null | undefined): value is NetworkDesign {
  return (NETWORK_DESIGNS as readonly string[]).includes(value ?? "");
}

/** Request header carrying a previewed design (development only, see the proxy). */
export const NETWORK_DESIGN_HEADER = "x-network-design";
export const NETWORK_DESIGN_COOKIE = "network_design";

/**
 * The product moment shown in the hero, written for the clone's audience:
 * an agency's client list, or the referral widget a shop's customer sees.
 */
export type NetworkShowcase =
  | {
      kind: "roster";
      caption: string;
      rows: { client: string; campaign: string; signups: number; live: boolean }[];
    }
  | {
      kind: "widget";
      caption: string;
      business: string;
      offer: string;
      body: string;
      link: string;
      toast: string;
    };

export type NetworkSite = {
  /** Route segment and local preview host: {key}.localhost */
  key: string;
  /** Bare domain; www. is accepted too. */
  domain: string;
  name: string;
  /** Taken from the brandidentity.com logo; primary must be readable under white text. */
  colors: { primary: string; accent: string; ink: string; tint: string };
  tagline: string;
  /** One-sentence description for meta tags and the footer. */
  description: string;
  /** audience: who the clone is for, in plain words ("For small businesses"). */
  hero: { audience: string; headline: string; sub: string; cta: string };
  benefits: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  showcase: NetworkShowcase;
  /** Playful bits: tilted badges by the hero button. */
  stickers: string[];
  /** Scrolling feed of things happening in a program (illustrative). */
  ticker: string[];
  /** One share turning into new customers, drawn as cartoon faces. */
  chain: { title: string; people: { name: string; does: string }[]; reward: string };
  /** Last big line before the closing button. */
  closer: string;
  design: NetworkDesign;
  pages: NetworkPage[];
  /** Served on its real domain only when true (after DNS points here). */
  enabled: boolean;
};

export const NETWORK_SITES: NetworkSite[] = [
  {
    key: "referrals-net",
    domain: "referrals.net",
    name: "Referrals.net",
    colors: { primary: "#4f46e5", accent: "#c026d3", ink: "#1e1b4b", tint: "#eef2ff" },
    tagline: "Referral programs for every client you manage",
    description:
      "Referrals.net helps agencies and consultants launch and run referral programs for their clients, one brand per client, from a single account.",
    hero: {
      audience: "For agencies and consultants",
      headline: "Run a referral program for every client, from one account",
      sub: "Set up a branded referral campaign per client, put the widget on their site, and show them the signups it brings in. Agency plans cover 10 or 50 client brands on one subscription.",
      cta: "Start free",
    },
    benefits: [
      {
        title: "One login, many client brands",
        body: "Each client gets their own brand with its own campaigns, rewards and widget. You switch between them without juggling accounts.",
      },
      {
        title: "Their branding, not ours",
        body: "Paid brands can hide the Referrals branding and run on the client's own subdomain or custom domain.",
      },
      {
        title: "Results you can report",
        body: "Shares, clicks, signups and leaderboards per campaign, so the monthly client report writes itself.",
      },
    ],
    steps: [
      {
        title: "Add a client brand",
        body: "Create a brand for the client and pick a campaign template: give-get coupon, milestone rewards, share-to-unlock or a floating invite.",
      },
      {
        title: "Set the reward",
        body: "Choose what referrers earn: a coupon code, a cash reward or a place on the leaderboard.",
      },
      {
        title: "Embed and publish",
        body: "Paste one snippet on the client's site, or share the hosted campaign page. Publishing a brand is $9/mo, or use an agency plan.",
      },
      {
        title: "Track and report",
        body: "Watch shares and signups come in per campaign and export the list for the client.",
      },
    ],
    faqs: [
      {
        q: "How is Referrals.net related to Referrals.com?",
        a: "Referrals.net is part of the Referrals.com network. Your account, brands, billing and support are all on Referrals.com, so you sign in there.",
      },
      {
        q: "What do agency plans include?",
        a: "Agency 10 and Agency 50 let you publish up to 10 or 50 client brands on one subscription, with every feature included.",
      },
      {
        q: "Can I set up a client before paying?",
        a: "Yes. Creating an account and setting up brands is free. You pay when you publish a brand and start accepting signups.",
      },
      {
        q: "Can each client use their own domain?",
        a: "Yes. A paid brand can run on a subdomain like client.referrals.com or on the client's own domain, without Referrals branding.",
      },
    ],
    showcase: {
      kind: "roster",
      caption: "Every client's program in one list, on Referrals.com",
      rows: [
        { client: "Northside Dental", campaign: "Give $25, get $25", signups: 48, live: true },
        { client: "Bloom & Stem Florist", campaign: "Milestone rewards", signups: 31, live: true },
        { client: "Peak Fitness Studio", campaign: "Share to unlock", signups: 17, live: true },
        { client: "Harbor Coffee", campaign: "Floating invite", signups: 0, live: false },
      ],
    },
    stickers: ["Free to set up", "Their logo, not ours", "10 or 50 clients, one bill"],
    ticker: [
      "🦷 Northside Dental got 4 new patients today",
      "🌷 Bloom & Stem just passed 30 referrals",
      "🏋️ Peak Fitness launched Share to unlock",
      "🎟️ Dana's $25 credit is on its way",
      "📈 Exported this month's signups for Bloom & Stem",
      "☕ Harbor Coffee's campaign is ready to publish",
    ],
    chain: {
      title: "One happy patient, three new ones",
      people: [
        { name: "Dana", does: "Shares Northside Dental" },
        { name: "Tom", does: "Books a cleaning" },
        { name: "Ana", does: "Hears it from Tom" },
        { name: "Raj", does: "Books too" },
      ],
      reward: "$25 credit",
    },
    closer: "Give every client a referral program they'll brag about.",
    design: "studio",
    pages: ["home", "how-it-works", "pricing"],
    enabled: true,
  },
  {
    key: "referralprogram",
    domain: "referralprogram.com",
    name: "ReferralProgram.com",
    colors: { primary: "#c2410c", accent: "#f97316", ink: "#2e1065", tint: "#fff7ed" },
    tagline: "Launch your first referral program this afternoon",
    description:
      "ReferralProgram.com helps small businesses start a refer-a-friend program: pick a template, set a reward, and add it to your site in minutes.",
    hero: {
      audience: "For small businesses",
      headline: "Your customers already talk about you. Reward them for it.",
      sub: "Pick a ready-made referral program, choose what people earn for sharing, and add it to your website with one snippet. Set it up free and pay $9/mo when you go live.",
      cta: "Create my program",
    },
    benefits: [
      {
        title: "Templates, not a blank page",
        body: "Start from a give-get coupon, milestone rewards or share-to-unlock template and change only the words and the reward.",
      },
      {
        title: "Rewards people actually want",
        body: "Give a discount coupon, a cash reward or a spot on the leaderboard for your top sharers.",
      },
      {
        title: "Works on the site you already have",
        body: "Paste one snippet into any website builder, or share the hosted campaign page by email, text or social.",
      },
    ],
    steps: [
      {
        title: "Pick a template",
        body: "Choose the kind of program you want and give it your business name and logo.",
      },
      {
        title: "Choose the reward",
        body: "Decide what your customers earn for each friend who signs up.",
      },
      {
        title: "Go live",
        body: "Add the widget to your site or share your campaign link. Publishing is $9/mo per brand, or $99/yr.",
      },
      {
        title: "Watch referrals come in",
        body: "See who shared, who signed up and who earned a reward, all in one dashboard.",
      },
    ],
    faqs: [
      {
        q: "How is ReferralProgram.com related to Referrals.com?",
        a: "ReferralProgram.com is part of the Referrals.com network. Your account, billing and support are on Referrals.com, so you sign in there.",
      },
      {
        q: "How much does a referral program cost?",
        a: "Setting up is free. Publishing a brand and accepting signups is $9/mo, or $99/yr. There are no per-referral fees.",
      },
      {
        q: "Do I need a developer?",
        a: "No. You paste one snippet into your website builder, or just share the hosted campaign page link.",
      },
      {
        q: "What kind of rewards can I offer?",
        a: "Coupon codes, cash rewards or a place on the leaderboard. You set the reward for each campaign.",
      },
    ],
    showcase: {
      kind: "widget",
      caption: "What your customers see on your website",
      business: "Juniper Bakery",
      offer: "Give 15%, get 15%",
      body: "Share your link. When a friend places their first order, you both get 15% off.",
      link: "refer.juniperbakery.com/t/m4ya",
      toast: "Sam joined through Maya's link. Two 15% coupons sent.",
    },
    stickers: ["Free to set up", "No per-referral fees", "No developer needed"],
    ticker: [
      "🔗 Maya shared her link",
      "🧁 Sam got 15% off his first order",
      "👋 Priya joined through Sam",
      "🏆 Maya is top of the leaderboard",
      "🎁 Two coupons sent",
      "💌 Leo invited three friends",
    ],
    chain: {
      title: "One happy customer, three new ones",
      people: [
        { name: "Maya", does: "Shares her link" },
        { name: "Sam", does: "Places his first order" },
        { name: "Priya", does: "Hears it from Sam" },
        { name: "Leo", does: "Orders too" },
      ],
      reward: "15% off",
    },
    closer: "Go on, let your customers brag about you.",
    design: "storefront",
    pages: ["home", "how-it-works", "pricing"],
    enabled: true,
  },
];

const BY_DOMAIN = new Map<string, NetworkSite>();
const BY_KEY = new Map<string, NetworkSite>();
for (const site of NETWORK_SITES) {
  BY_DOMAIN.set(site.domain, site);
  BY_DOMAIN.set(`www.${site.domain}`, site);
  BY_KEY.set(site.key, site);
}

export function networkSiteByKey(key: string): NetworkSite | null {
  return BY_KEY.get(key) ?? null;
}

/** "referrals.net" or "www.referrals.net" -> site, for ?via= on referrals.com. */
export function networkSiteByDomain(domain: string | null | undefined): NetworkSite | null {
  return BY_DOMAIN.get((domain ?? "").toLowerCase().trim()) ?? null;
}

/**
 * The clone a request host belongs to. Real domains only count once the site
 * is enabled; {key}.localhost works in development for previewing.
 */
export function networkSiteForHost(host: string): NetworkSite | null {
  const site = BY_DOMAIN.get(host);
  if (site) return site.enabled ? site : null;
  if (process.env.NODE_ENV !== "production" && host.endsWith(".localhost")) {
    return BY_KEY.get(host.slice(0, -".localhost".length)) ?? null;
  }
  return null;
}

/** Where accounts live: www.referrals.com, or the local app in development. */
export function networkAppOrigin(): string {
  const origin = canonicalOrigin(process.env.NEXT_PUBLIC_APP_URL);
  // In dev, Next rewrites a proxy redirect to "localhost" into a relative one,
  // which would keep the visitor on {key}.localhost. app.localhost is the same
  // app (isAppHost) under a name Next leaves alone.
  if (process.env.NODE_ENV !== "production") {
    return origin.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/, "$1app.localhost");
  }
  return origin;
}

/** Public URL of a clone page, for canonicals and sitemaps. */
export function networkSiteUrl(site: NetworkSite, path = "/"): string {
  const origin = site.enabled || process.env.NODE_ENV === "production"
    ? `https://${site.domain}`
    : `http://${site.key}.localhost:${process.env.PORT || 3000}`;
  return path === "/" ? origin : `${origin}${path}`;
}

/**
 * Sign-up link that credits the clone. It must go through referrals.com's own
 * /go so the rref cookie is set on referrals.com, where sign-up reads it.
 */
export function networkSignupHref(site: NetworkSite): string {
  const app = networkAppOrigin();
  const dest = `${app}/signup?via=${encodeURIComponent(site.domain)}`;
  return `${app}/go?ref=${encodeURIComponent(site.domain)}&url=${encodeURIComponent(dest)}`;
}

export function networkSigninHref(site: NetworkSite): string {
  return `${networkAppOrigin()}/signin?via=${encodeURIComponent(site.domain)}`;
}

const PAGE_PATHS: Record<NetworkPage, string> = {
  home: "/",
  "how-it-works": "/how-it-works",
  pricing: "/pricing",
};

export function networkPagePath(page: NetworkPage): string {
  return PAGE_PATHS[page];
}

export type NetworkRoute =
  | { kind: "rewrite"; pathname: string }
  | { kind: "redirect"; url: string }
  | { kind: "next" };

/**
 * What a clone host does with a path: its own pages are rewritten to
 * /network/{key}/..., sign-up goes through the crediting /go link, and every
 * other page belongs to referrals.com.
 */
export function networkRoute(site: NetworkSite, pathname: string, search = ""): NetworkRoute {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (path === "/robots.txt" || path === "/sitemap.xml") {
    return { kind: "rewrite", pathname: `/network/${site.key}${path}` };
  }
  if (path.startsWith("/_next/") || path.includes(".")) return { kind: "next" };

  const page = site.pages.find((p) => PAGE_PATHS[p] === path);
  if (page) {
    return { kind: "rewrite", pathname: `/network/${site.key}${path === "/" ? "" : path}` };
  }
  if (path === "/signup" || path === "/get-started") {
    return { kind: "redirect", url: networkSignupHref(site) };
  }
  if (path === "/signin" || path === "/login") {
    return { kind: "redirect", url: networkSigninHref(site) };
  }
  return { kind: "redirect", url: `${networkAppOrigin()}${path}${search}` };
}

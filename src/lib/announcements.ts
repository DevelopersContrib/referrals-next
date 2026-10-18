/**
 * Product announcements shown in the dashboard "What's new" card.
 * Newest first. Keep each one short: what changed and where to try it.
 */
export type Announcement = {
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  href: string;
  cta: string;
};

export const announcements: Announcement[] = [
  {
    date: "2026-10-18",
    title: "Refer & Earn is here",
    body: "Your personal referral link, share buttons and earnings, all on one page.",
    href: "/refer",
    cta: "Open Refer & Earn",
  },
  {
    date: "2026-10-18",
    title: "Yearly plan: one month free",
    body: "Publish a brand for $99 a year instead of $108 paying monthly.",
    href: "/billing",
    cta: "See plans",
  },
  {
    date: "2026-10-18",
    title: "Campaigns built for you",
    body: "Add your website and get 3 ready-to-use referral campaigns in about a minute.",
    href: "/brands",
    cta: "Try it",
  },
];

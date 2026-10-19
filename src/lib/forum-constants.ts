export const PUBLIC_TOPIC_STATUSES = ["open", "answered"] as const;

export const FORUM_CATEGORIES = [
  {
    slug: "announcements",
    name: "Announcements",
    description: "Official notes from the Referrals.com team.",
    sort_order: 1,
    is_archived: false,
    teamOnly: true,
  },
  {
    slug: "getting-started",
    name: "Getting started",
    description: "Publishing a brand, billing, and your first campaign.",
    sort_order: 2,
    is_archived: false,
    teamOnly: false,
  },
  {
    slug: "campaigns-rewards",
    name: "Campaigns & rewards",
    description: "Reward design, goals, and what is converting.",
    sort_order: 3,
    is_archived: false,
    teamOnly: false,
  },
  {
    slug: "widgets-api",
    name: "Widgets & API",
    description: "Embeds, signup widgets, and API access.",
    sort_order: 4,
    is_archived: false,
    teamOnly: false,
  },
  {
    slug: "feature-requests",
    name: "Feature requests",
    description: "Ideas for the product. Vote with replies.",
    sort_order: 5,
    is_archived: false,
    teamOnly: false,
  },
  {
    slug: "show-your-campaign",
    name: "Show your campaign",
    description: "Share a live program and get feedback.",
    sort_order: 6,
    is_archived: false,
    teamOnly: false,
  },
  {
    slug: "archive",
    name: "Archive",
    description: "Older threads from 2019–2021. Read-only.",
    sort_order: 7,
    is_archived: true,
    teamOnly: false,
  },
] as const;

export const PINNED_TOPIC_SLUGS = [
  "how-publishing-a-brand-works",
  "widget-signups-wait-until-publish",
] as const;

export const SEEDED_TOPIC_CATEGORY: Record<string, string> = {
  "how-publishing-a-brand-works": "getting-started",
  "widget-signups-wait-until-publish": "getting-started",
  "campaign-stays-private-until-you-pay": "campaigns-rewards",
  "where-to-copy-the-referral-link": "getting-started",
  "what-reward-are-you-using-for-saas": "campaigns-rewards",
  "double-sided-or-single-reward": "campaigns-rewards",
  "browse-programs-by-industry": "feature-requests",
  "api-access-is-limited-to-your-campaigns": "widgets-api",
};

export const LEGACY_CATEGORY_SLUG_MAP: Record<string, string> = {
  campaigns: "campaigns-rewards",
  "feature-suggestions": "feature-requests",
  "community-governance": "widgets-api",
};

import { getRewardKind, type RewardKind } from "@/lib/reward-types";
import type { WidgetSettings } from "@/lib/widget-settings";
import type { CampaignWizardFormData } from "@/components/campaigns/campaign-wizard";

/**
 * Use-case presets layered over the 4 real campaign types
 * (Social Rewards, Invite For Perks, Gamification Based, Voting Campaign).
 * Each preset bundles a campaign type + reward + goal + copy + widget settings
 * (placement/look). Code-defined so there is no migration and one source of truth.
 *
 * Layout note: floating/topbar are expressed via `template_id` (resolved in
 * `@/lib/widget-js`) because the `placement` enum only supports embed|popup.
 */
export interface CampaignPreset {
  id: string;
  label: string;
  description: string;
  /** Display group in the picker = campaign type label. */
  group: string;
  tag: "Free" | "Premium";
  /** Key mapped to a lucide icon by the picker UI. */
  icon: string;
  gradient: string;
  /** Matches one of the 4 rows in `campaign_types` by name. */
  campaignTypeMatch: RegExp;
  rewardKind: RewardKind;
  goal: { type: "signup" | "visit"; count: number };
  /** Surface + encourage a banner image in the widget editor afterward. */
  imageForward?: boolean;
  widget: WidgetSettings;
  copy: {
    name: string;
    widgetDescription: string;
    buttonText: string;
    entrySubject: string;
    entryMessage: string;
    rewardSubject: string;
    rewardMessage: string;
  };
}

export const campaignPresets: CampaignPreset[] = [
  // ── Social Rewards (type 1) ─────────────────────────────────────────────
  {
    id: "social-share-unlock",
    label: "Share to Unlock",
    description:
      "Visitors share your link and unlock a reward the moment friends sign up. Great for launch-week buzz.",
    group: "Social Rewards",
    tag: "Free",
    icon: "share",
    gradient: "from-[#FF5C62] via-[#ff7a6f] to-[#ff9a8b]",
    campaignTypeMatch: /social/i,
    rewardKind: "custom",
    goal: { type: "signup", count: 3 },
    imageForward: true,
    widget: {
      placement: "embed",
      template_id: 3,
      background_type: "color",
      button_text: "Share & unlock",
      success_message: "You're in! Share your link to unlock your reward.",
    },
    copy: {
      name: "{brand} Share Rewards",
      widgetDescription:
        "Share {brand} with friends. When they join, your reward unlocks automatically.",
      buttonText: "Share & unlock",
      entrySubject: "Welcome to {brand} rewards!",
      entryMessage:
        "Thanks for joining! Share your unique link with friends — when they sign up, you earn.",
      rewardSubject: "You unlocked your {brand} reward!",
      rewardMessage: "Nice work! Your reward for sharing {brand} is ready.",
    },
  },
  {
    id: "social-floating",
    label: "Floating Invite",
    description:
      "A floating button that follows visitors and opens an invite panel — always on, never in the way.",
    group: "Social Rewards",
    tag: "Free",
    icon: "sparkles",
    gradient: "from-[#e11d48] via-[#FF5C62] to-[#fb7185]",
    campaignTypeMatch: /social/i,
    rewardKind: "custom",
    goal: { type: "signup", count: 3 },
    widget: {
      template_id: 4, // FLOATING
      popup_button_text: "Refer a friend",
      popup_button_position: "bottom-right",
      button_text: "Send invite",
    },
    copy: {
      name: "{brand} Refer a Friend",
      widgetDescription: "Invite friends to {brand} and earn rewards when they join.",
      buttonText: "Send invite",
      entrySubject: "Start referring {brand}",
      entryMessage: "Share your link with friends. Every signup gets you closer to a reward.",
      rewardSubject: "Your {brand} referral reward is here",
      rewardMessage: "Thanks for spreading the word about {brand} — here's your reward!",
    },
  },
  {
    id: "social-announcement",
    label: "Announcement Bar",
    description:
      "A slim top bar promoting your referral program site-wide, with an optional countdown.",
    group: "Social Rewards",
    tag: "Free",
    icon: "panel-top",
    gradient: "from-[#9f1239] via-[#FF5C62] to-[#fecdd3]",
    campaignTypeMatch: /social/i,
    rewardKind: "custom",
    goal: { type: "signup", count: 2 },
    widget: {
      template_id: 9, // INFO_BAR / topbar
      button_text: "Refer & earn",
      allow_countdown: true,
    },
    copy: {
      name: "{brand} Referral Promo",
      widgetDescription: "Refer friends to {brand} for a limited-time reward.",
      buttonText: "Refer & earn",
      entrySubject: "Refer {brand} and earn",
      entryMessage: "Invite friends before the promo ends and claim your reward.",
      rewardSubject: "You earned your {brand} promo reward",
      rewardMessage: "Your referral reward from {brand} is ready to use.",
    },
  },

  // ── Invite For Perks (type 2) ───────────────────────────────────────────
  {
    id: "invite-give-get",
    label: "Give-Get Coupon",
    description:
      "Give friends a discount, get one yourself. The classic give-$10-get-$10 loop for ecommerce.",
    group: "Invite For Perks",
    tag: "Free",
    icon: "gift",
    gradient: "from-[#6b4bb7] via-[#926efb] to-[#b8a4fc]",
    campaignTypeMatch: /invite|perk/i,
    rewardKind: "coupons",
    goal: { type: "signup", count: 1 },
    imageForward: true,
    widget: {
      placement: "embed",
      template_id: 3,
      field_label_1: "Full name",
      field_label_2: "Email address",
      button_text: "Get my code",
      success_message: "Your coupon is on its way — share your link so friends get theirs too!",
    },
    copy: {
      name: "{brand} Give-Get Rewards",
      widgetDescription:
        "Give friends a coupon for {brand}, and get one yourself when they buy.",
      buttonText: "Get my code",
      entrySubject: "Here's your {brand} coupon",
      entryMessage: "Share your link — when a friend uses their coupon, you get yours too.",
      rewardSubject: "Your {brand} coupon is ready",
      rewardMessage: "Thanks for referring {brand}! Your coupon code is inside.",
    },
  },
  {
    id: "invite-perk-popup",
    label: "Perk Popup",
    description:
      "A focused popup that pitches the perk and captures signups — high intent, low friction.",
    group: "Invite For Perks",
    tag: "Premium",
    icon: "gift",
    gradient: "from-[#5b21b6] via-[#7c3aed] to-[#a78bfa]",
    campaignTypeMatch: /invite|perk/i,
    rewardKind: "coupons",
    goal: { type: "signup", count: 1 },
    widget: {
      placement: "popup",
      template_id: 11, // SIMPLE_POPUP
      popup_button_text: "Unlock my perk",
      button_text: "Claim perk",
      success_message: "Perk unlocked! Check your email for the details.",
    },
    copy: {
      name: "{brand} Perks",
      widgetDescription: "Unlock a members-only perk from {brand} by inviting a friend.",
      buttonText: "Claim perk",
      entrySubject: "Your {brand} perk awaits",
      entryMessage: "Invite a friend to unlock your perk from {brand}.",
      rewardSubject: "Perk unlocked at {brand}",
      rewardMessage: "Your {brand} perk is ready — enjoy!",
    },
  },

  // ── Gamification Based (type 3) ─────────────────────────────────────────
  {
    id: "gamify-milestones",
    label: "Milestone Rewards",
    description:
      "Reward fans as they hit referral milestones, with a live leaderboard to keep them sharing.",
    group: "Gamification Based",
    tag: "Premium",
    icon: "trophy",
    gradient: "from-[#3b0764] via-[#7c3aed] to-[#c4b5fd]",
    campaignTypeMatch: /gamif/i,
    rewardKind: "custom",
    goal: { type: "signup", count: 5 },
    imageForward: true,
    widget: {
      placement: "embed",
      template_id: 5, // FORM
      stats_on: true,
      button_text: "Join the challenge",
      success_message: "You're on the board! Refer friends to climb the leaderboard.",
    },
    copy: {
      name: "{brand} Referral Challenge",
      widgetDescription:
        "Refer friends to {brand}, climb the leaderboard, and unlock milestone rewards.",
      buttonText: "Join the challenge",
      entrySubject: "The {brand} referral challenge is on",
      entryMessage: "Refer friends to hit milestones and win rewards. Track your rank live.",
      rewardSubject: "Milestone reached at {brand}!",
      rewardMessage: "You hit a referral milestone with {brand} — here's your reward.",
    },
  },
];

export interface ResolveContext {
  campaignTypes: { id: number; name: string }[];
  rewardTypes: { id: number; name: string }[];
  brandName?: string | null;
  brandColors?: Record<string, string> | null;
}

export interface ResolvedPreset {
  form: Partial<CampaignWizardFormData>;
  widget: WidgetSettings;
}

function interpolate(s: string, brand: string): string {
  return s.replace(/\{brand\}/g, brand);
}

function stripHash(hex: string | undefined): string | undefined {
  if (typeof hex !== "string") return undefined;
  const s = hex.replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : undefined;
}

/**
 * Turn a preset into wizard form values + widget settings, resolving the
 * campaign/reward type ids at runtime and overlaying the brand palette + name.
 */
export function resolvePreset(
  preset: CampaignPreset,
  ctx: ResolveContext
): ResolvedPreset {
  const brand = (ctx.brandName || "").trim() || "your brand";

  const type = ctx.campaignTypes.find((t) => preset.campaignTypeMatch.test(t.name || ""));
  const reward = ctx.rewardTypes.find((r) => getRewardKind(r.name) === preset.rewardKind);

  const palette = ctx.brandColors || {};
  const primary = stripHash(palette.primary);
  const accent = stripHash(palette.accent) || stripHash(palette.secondary) || primary;
  const bg = stripHash(palette.background);
  const text = stripHash(palette.text);

  const form: Partial<CampaignWizardFormData> = {
    name: interpolate(preset.copy.name, brand),
    goal_type: preset.goal.type,
    ...(preset.goal.type === "signup"
      ? { num_signups: String(preset.goal.count) }
      : { num_visits: String(preset.goal.count) }),
    campaign_entry_subject: interpolate(preset.copy.entrySubject, brand),
    campaign_entry_message: interpolate(preset.copy.entryMessage, brand),
    reward_notify_subject: interpolate(preset.copy.rewardSubject, brand),
    reward_notify_message: interpolate(preset.copy.rewardMessage, brand),
    widget_description: interpolate(preset.copy.widgetDescription, brand),
    widget_button_text: preset.copy.buttonText,
  };
  if (type) form.type_id = String(type.id);
  if (reward) form.reward_type = String(reward.id);
  if (primary) form.widget_color = primary;
  if (accent) form.widget_button_color = accent;

  const widget: WidgetSettings = {
    ...preset.widget,
    header_title: interpolate(preset.widget.header_title || preset.copy.name, brand),
    description: interpolate(
      preset.widget.description || preset.copy.widgetDescription,
      brand
    ),
    button_text: preset.widget.button_text || preset.copy.buttonText,
    ...(preset.widget.success_message
      ? { success_message: interpolate(preset.widget.success_message, brand) }
      : {}),
    ...(primary ? { color: primary } : {}),
    ...(accent ? { button_color: accent, popup_button_color: accent } : {}),
    ...(bg ? { background_color: bg } : {}),
    ...(text ? { text_color: text } : {}),
  };

  return { form, widget };
}

import { DESIGN_META, isCampaignDesign, type CampaignDesignStyle } from "./campaign-design";

/** Map an AI campaign suggestion onto widget / social / reward fields. */

export const KIND_LOOK = {
  fast_growth: {
    label: "Fast Growth",
    from: "#FF5C62",
    to: "#ff7a54",
    accent: "ff5c62",
    cta: "Get my offer",
  },
  revenue: {
    label: "Revenue Growth",
    from: "#10b981",
    to: "#059669",
    accent: "10b981",
    cta: "Start earning",
  },
  loyalty: {
    label: "Customer Loyalty",
    from: "#926efb",
    to: "#7c3aed",
    accent: "926efb",
    cta: "Join the program",
  },
} as const;

export type CampaignKindKey = keyof typeof KIND_LOOK;

export type SuggestionPayload = {
  landingCopy?: string;
  emailSequence?: string[];
  socialPosts?: string[];
  sms?: string;
  widgetCopy?: string;
  successPage?: string;
  fraudTips?: string[];
  launchChannels?: string[];
  accentColor?: string;
  goalType?: "visit" | "signup";
  copyTone?: string;
  bannerImageUrl?: string;
  designStyle?: CampaignDesignStyle;
};

export function isCampaignKind(v: string | null | undefined): v is CampaignKindKey {
  return v === "fast_growth" || v === "revenue" || v === "loyalty";
}

export function kindLook(kind: string | null | undefined) {
  return isCampaignKind(kind) ? KIND_LOOK[kind] : KIND_LOOK.fast_growth;
}

export function readSuggestionPayload(raw: unknown): SuggestionPayload {
  if (!raw || typeof raw !== "object") return {};
  return raw as SuggestionPayload;
}

function hex6(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : undefined;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function firstCrawlHex(colors: unknown): string | undefined {
  if (!Array.isArray(colors)) return undefined;
  for (const c of colors) {
    const h = hex6(c);
    if (h) return h;
  }
  return undefined;
}

/** Shared MySQL columns are often latin1 — drop emoji so inserts don't fail. */
function stripFancy(text: string): string {
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}

function parseCashAmount(text: string): number | null {
  const m = text.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function widgetSeedFromSuggestion(input: {
  kind: string | null | undefined;
  headline: string | null | undefined;
  name: string;
  description: string | null | undefined;
  payload: SuggestionPayload;
  crawlColors?: unknown;
  brandColors?: unknown;
}) {
  const look = kindLook(input.kind);
  const payload = input.payload;
  const brandPrimary =
    input.brandColors && typeof input.brandColors === "object"
      ? hex6((input.brandColors as Record<string, unknown>).primary)
      : undefined;
  const crawled = firstCrawlHex(input.crawlColors);
  const brandHex = brandPrimary || crawled;
  const brandIsDark = brandHex ? luminance(brandHex) < 0.35 : false;

  // Kind accent is the designed CTA color. A near-black crawl color is brand
  // text, not a button — that is why the launched widget looked washed out.
  const chosen = hex6(payload.accentColor);
  const accent = chosen || look.accent;
  const text = brandIsDark && brandHex ? brandHex : "1f2937";

  return {
    header_title: (input.headline || input.name).slice(0, 100),
    description: (
      payload.widgetCopy ||
      input.description ||
      `Join ${input.name} and earn rewards!`
    ).slice(0, 65000),
    body_text: (payload.landingCopy || "").slice(0, 65000) || null,
    success_message: (payload.successPage || "").slice(0, 65000) || null,
    button_text: look.cta.slice(0, 100),
    join_button_text: look.cta.slice(0, 200),
    color: accent,
    button_color: accent,
    text_color: text,
    header_font_color: text,
    header_description_color: "6b7280",
    background_type: "color" as const,
    background_color: "ffffff",
    template_id: isCampaignDesign(payload.designStyle)
      ? DESIGN_META[payload.designStyle].templateId
      : 3,
    cashHint: parseCashAmount(
      `${input.headline || ""} ${input.description || ""} ${payload.widgetCopy || ""}`
    ),
    shareText: stripFancy(
      payload.socialPosts?.[0] || payload.landingCopy || input.description || ""
    ).slice(0, 2000),
    banner_image_url: payload.bannerImageUrl?.trim().slice(0, 4000) || null,
  };
}

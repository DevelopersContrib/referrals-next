export const CAMPAIGN_DESIGNS = ["editorial", "hero", "minimal", "warm"] as const;
export type CampaignDesignStyle = (typeof CAMPAIGN_DESIGNS)[number];

export function isCampaignDesign(v: unknown): v is CampaignDesignStyle {
  return typeof v === "string" && (CAMPAIGN_DESIGNS as readonly string[]).includes(v);
}

export const DESIGN_META: Record<
  CampaignDesignStyle,
  {
    label: string;
    desc: string;
    imagePrompt: string;
    copyHint: string;
    templateId: number;
  }
> = {
  editorial: {
    label: "Editorial",
    desc: "Two-column page — story on the left, join card on the right.",
    imagePrompt:
      "editorial magazine photography, natural light, lifestyle, refined composition",
    copyHint: "Write like a magazine feature: clear, confident, specific.",
    templateId: 3,
  },
  hero: {
    label: "Bold hero",
    desc: "Full-width image and a big centered headline. High energy.",
    imagePrompt:
      "cinematic wide banner, high contrast, dramatic lighting, bold composition",
    copyHint: "Short punchy headlines. One strong offer. Act-now energy.",
    templateId: 3,
  },
  minimal: {
    label: "Minimal",
    desc: "Quiet and spacious. Small logo, clean type, lots of white.",
    imagePrompt:
      "minimal abstract composition, generous negative space, refined muted tones",
    copyHint: "Fewer words. Precise. No hype.",
    templateId: 1,
  },
  warm: {
    label: "Warm cards",
    desc: "Soft, rounded, friendly — image inset, cozy join card.",
    imagePrompt:
      "warm lifestyle photography, soft light, cozy community, rounded organic shapes",
    copyHint: "Welcoming and human. Talk like a host, not an ad.",
    templateId: 3,
  },
};

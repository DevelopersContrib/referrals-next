import { generateImage, hasOpenAI } from "@/lib/openai";
import { persistImageToS3 } from "@/lib/s3";
import { DESIGN_META, type CampaignDesignStyle } from "./campaign-design";
import type { CampaignKind } from "./intelligence";

const GOAL_VIBE: Record<CampaignKind, string> = {
  fast_growth: "energetic growth, people sharing with friends, momentum",
  revenue: "premium commerce, a rewarding purchase, success",
  loyalty: "warm community, belonging, returning customers",
};

export async function generateCampaignHeroImage(opts: {
  memberId: number;
  domain: string;
  industry?: string | null;
  brandVoice?: string | null;
  summary?: string | null;
  color: string;
  copyTone: string;
  goalKind: CampaignKind;
  designStyle?: CampaignDesignStyle;
}): Promise<string | null> {
  if (!hasOpenAI()) return null;

  const prompt = [
    `Wide horizontal marketing banner for a referral program for ${opts.domain}.`,
    opts.industry ? `Industry: ${opts.industry}.` : "",
    `Mood: ${GOAL_VIBE[opts.goalKind]}. Tone: ${opts.copyTone}.`,
    `Dominant color: ${opts.color}.`,
    opts.brandVoice ? `Brand voice: ${opts.brandVoice}.` : "",
    opts.summary ? `Brand: ${opts.summary.slice(0, 180)}.` : "",
    opts.designStyle ? `Visual style: ${DESIGN_META[opts.designStyle].imagePrompt}.` : "",
    "No text, no words, no logos, no watermarks, no letters.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const raw = await generateImage({ prompt });
    const key = `uploads/campaigns/${opts.memberId}_${Date.now()}.png`;
    try {
      return await persistImageToS3(raw, key);
    } catch (err) {
      console.error("persistImageToS3 failed", err);
      return raw.startsWith("data:") ? null : raw;
    }
  } catch (err) {
    console.error("campaign hero image failed", err);
    return null;
  }
}

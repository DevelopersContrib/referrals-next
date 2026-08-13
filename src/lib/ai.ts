/** Engagement AI drafts / segments — uses OpenAI (Referrals already has OPENAI_API_KEY). */

import { chatComplete, hasOpenAI } from "@/lib/openai";

export function aiEnabled(): boolean {
  return hasOpenAI();
}

export async function completeText(
  prompt: string,
  opts: { maxTokens?: number; system?: string } = {}
): Promise<string | null> {
  if (!hasOpenAI()) return null;
  try {
    return await chatComplete({
      prompt,
      system: opts.system,
      maxTokens: opts.maxTokens ?? 1024,
      model: process.env.OPENAI_ENGAGEMENT_MODEL || process.env.OPENAI_SUPPORT_MODEL || "gpt-4o-mini",
    });
  } catch (e) {
    console.error("[ai]", e);
    return null;
  }
}

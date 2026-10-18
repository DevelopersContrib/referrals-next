import { prisma } from "@/lib/prisma";
import { referralsSignupCampaignId } from "@/lib/signup-referral";
import { siteUrl } from "@/lib/site-url";

/**
 * The growth loop: every public page and widget shows a small
 * "Powered by Referrals.com" link that carries the brand owner's own
 * Referrals.com referral code (rref). A visitor who signs up through it is
 * credited to that owner, so owners earn for every business they bring in.
 *
 * Returns null when the owner has switched the link off.
 */
export async function poweredByHref(
  brand: {
    member_id: number;
    slug?: string | null;
    domain?: string | null;
    hide_powered_by?: boolean | null;
  },
  medium: "campaign_page" | "brand_page" | "widget",
): Promise<string | null> {
  if (brand.hide_powered_by) return null;

  const owner = await prisma.campaign_participants
    .findFirst({
      where: { campaign_id: referralsSignupCampaignId(), participant_id: brand.member_id },
      select: { id: true },
    })
    .catch(() => null);

  const params = new URLSearchParams({
    utm_source: "powered_by",
    utm_medium: medium,
    utm_campaign: (brand.slug || brand.domain || "brand").slice(0, 80),
  });
  if (owner?.id) params.set("rref", String(owner.id));
  return `${siteUrl("/signup")}?${params.toString()}`;
}

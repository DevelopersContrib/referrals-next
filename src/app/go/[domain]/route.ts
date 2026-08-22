import { NextRequest } from "next/server";
import { goReferralRedirect } from "@/lib/go-referral";

/**
 * GET /go/<domain>
 *
 * Auto-attributing referral link. The domain in the URL is the REFERRER.
 * Place `https://referrals.com/go/<yourdomain>` anywhere — when a visitor
 * clicks it and signs up for referrals.com, <yourdomain> earns the referral
 * reward.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ domain: string }> }
) {
  const { domain } = await ctx.params;
  return goReferralRedirect(domain || "");
}

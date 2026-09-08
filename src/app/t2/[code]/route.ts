import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptShareCode, parseShareCode } from "@/lib/encryption";
import { recordShareClick, resolveSocialTypeId, appOrigin } from "@/lib/widget-share-tracking";
import { referralsSignupCampaignId } from "@/lib/signup-referral";
import { redirectWithReferralCookie } from "@/lib/referral-attribution-cookie";

/** GET /t2/[code] — same as /t/[code] (legacy share prefix). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const appUrl = appOrigin();

  try {
    const decrypted = decryptShareCode(code);
    const { campaignId, socialType, participantId } = parseShareCode(decrypted);

    const socialTypeId = await resolveSocialTypeId(socialType);
    if (socialTypeId !== null) {
      await recordShareClick({ campaignId, participantId, socialTypeId });
    }

    if (campaignId === referralsSignupCampaignId()) {
      const signup = new URL(`${appUrl}/signup`);
      signup.searchParams.set("rref", String(participantId));
      signup.searchParams.set("utm_source", "referral");
      signup.searchParams.set("utm_medium", "member");
      return redirectWithReferralCookie(signup, participantId, appUrl, "rref");
    }

    const campaign = await prisma.member_campaigns.findUnique({
      where: { id: campaignId },
    });
    let redirectUrl = appUrl;
    if (campaign) {
      const memberUrl = await prisma.member_urls.findUnique({
        where: { id: campaign.url_id },
      });
      const socialContent = await prisma.campaign_social_content.findFirst({
        where: { campaign_id: campaignId },
      });
      if (socialContent?.url?.startsWith("http")) redirectUrl = socialContent.url;
      else if (socialContent?.url && memberUrl?.domain) {
        redirectUrl = `https://${memberUrl.domain}${socialContent.url}`;
      } else {
        redirectUrl = `${appUrl}/widget/${campaignId}`;
      }
    }

    const destination = new URL(redirectUrl);
    destination.searchParams.set("ref", String(participantId));
    return redirectWithReferralCookie(destination, participantId, appUrl, "ref");
  } catch (error) {
    console.error("[/t2] Share link error:", error);
    return NextResponse.redirect(appUrl, 302);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptShareCode, parseShareCode } from "@/lib/encryption";
import { recordShareClick, resolveSocialTypeId, appOrigin } from "@/lib/widget-share-tracking";
import { referralsSignupCampaignId } from "@/lib/signup-referral";

/**
 * GET /t/[code] - Share link click tracking and redirect.
 *
 * Decodes the encrypted share code, increments clicks on the
 * participants_share record (creating it if missing), and redirects.
 */
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
      await recordShareClick({
        campaignId,
        participantId,
        socialTypeId,
      });
    }

    if (campaignId === referralsSignupCampaignId()) {
      const signup = new URL(`${appUrl}/signup`);
      signup.searchParams.set("rref", String(participantId));
      signup.searchParams.set("utm_source", "referral");
      signup.searchParams.set("utm_medium", "member");
      const res = NextResponse.redirect(signup.toString(), 302);
      res.cookies.set("rref", String(participantId), {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
      return res;
    }

    const redirectUrl = await getRedirectUrl(campaignId);
    const destination = new URL(redirectUrl);
    destination.searchParams.set("ref", String(participantId));

    return NextResponse.redirect(destination.toString(), 302);
  } catch (error) {
    console.error("[/t] Share link error:", error);
    return NextResponse.redirect(appUrl, 302);
  }
}

async function getRedirectUrl(campaignId: number): Promise<string> {
  const appUrl = appOrigin();

  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) return appUrl;

  const memberUrl = await prisma.member_urls.findUnique({
    where: { id: campaign.url_id },
  });
  if (!memberUrl?.url) return appUrl;

  const socialContent = await prisma.campaign_social_content.findFirst({
    where: { campaign_id: campaignId },
  });

  if (socialContent?.url) {
    if (socialContent.url.startsWith("http")) return socialContent.url;
    return `https://${memberUrl.domain}${socialContent.url}`;
  }

  return `${appUrl}/widget/${campaignId}`;
}

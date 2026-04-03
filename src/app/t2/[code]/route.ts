import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptShareCode, parseShareCode } from "@/lib/encryption";

/**
 * GET /t2/[code] - Alternative share link click tracking (backward compat).
 *
 * Same logic as /t/[code], kept for backward compatibility with
 * existing share links that use the /t2/ prefix.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

  try {
    const decrypted = decryptShareCode(code);
    const { campaignId, socialType, participantId } = parseShareCode(decrypted);

    // Increment click count
    const socialTypeId = await getSocialTypeId(socialType);
    if (socialTypeId !== null) {
      await prisma.participants_share.updateMany({
        where: {
          campaign_id: campaignId,
          participant_id: participantId,
          social_type: socialTypeId,
        },
        data: {
          clicks: { increment: 1 },
        },
      });
    }

    // Get redirect destination
    const redirectUrl = await getRedirectUrl(campaignId);

    const destination = new URL(redirectUrl);
    destination.searchParams.set("ref", String(participantId));

    return NextResponse.redirect(destination.toString(), 302);
  } catch (error) {
    console.error("[/t2] Share link error:", error);
    return NextResponse.redirect(appUrl, 302);
  }
}

async function getSocialTypeId(socialType: string): Promise<number | null> {
  const parsed = parseInt(socialType, 10);
  if (!isNaN(parsed)) return parsed;

  const social = await prisma.social_types.findFirst({
    where: { name: socialType },
  });
  return social?.id ?? null;
}

async function getRedirectUrl(campaignId: number): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

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

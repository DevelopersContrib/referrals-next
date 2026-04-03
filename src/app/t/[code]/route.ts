import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptShareCode, parseShareCode } from "@/lib/encryption";

/**
 * GET /t/[code] - Share link click tracking and redirect.
 *
 * Decodes the encrypted share code, increments clicks on the
 * participants_share record, and redirects to the campaign URL
 * or brand URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

  try {
    // Decrypt and parse the share code
    const decrypted = decryptShareCode(code);
    const { campaignId, socialType, participantId } = parseShareCode(decrypted);

    // Increment click count on the share record
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

    // Get redirect destination: campaign URL or brand URL
    const redirectUrl = await getRedirectUrl(campaignId);

    // Append referrer parameter to the redirect URL
    const destination = new URL(redirectUrl);
    destination.searchParams.set("ref", String(participantId));

    return NextResponse.redirect(destination.toString(), 302);
  } catch (error) {
    console.error("[/t] Share link error:", error);
    // Fallback: redirect to home page
    return NextResponse.redirect(appUrl, 302);
  }
}

async function getSocialTypeId(socialType: string): Promise<number | null> {
  // If it's already a number string, return it
  const parsed = parseInt(socialType, 10);
  if (!isNaN(parsed)) return parsed;

  // Look up by name
  const social = await prisma.social_types.findFirst({
    where: { name: socialType },
  });
  return social?.id ?? null;
}

async function getRedirectUrl(campaignId: number): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

  // Get the campaign
  const campaign = await prisma.member_campaigns.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) return appUrl;

  // Get the brand/URL associated with this campaign
  const memberUrl = await prisma.member_urls.findUnique({
    where: { id: campaign.url_id },
  });
  if (!memberUrl?.url) return appUrl;

  // Use the social content URL if available, otherwise the brand URL
  const socialContent = await prisma.campaign_social_content.findFirst({
    where: { campaign_id: campaignId },
  });

  if (socialContent?.url) {
    // If the social content URL is a full URL, use it
    if (socialContent.url.startsWith("http")) return socialContent.url;
    // Otherwise treat it as a path relative to the brand URL
    return `https://${memberUrl.domain}${socialContent.url}`;
  }

  // Default to the campaign widget page
  return `${appUrl}/widget/${campaignId}`;
}

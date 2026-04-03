import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptShareCode } from "@/lib/encryption";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/share
 *
 * Record a social share action.
 * Body: { campaignId, participantId, socialType }
 * Creates or updates participants_share record.
 * Returns the share URL for the given platform.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, participantId, socialType } = body;

    if (!campaignId || !participantId || !socialType) {
      return NextResponse.json(
        { error: "campaignId, participantId, and socialType are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve social type to ID
    const socialTypeId = await resolveSocialType(socialType);
    if (socialTypeId === null) {
      return NextResponse.json(
        { error: "Invalid social type" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate the share URL with encoded tracking
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
    const shareCode = encryptShareCode(
      `${campaignId}:${socialTypeId}:${participantId}`
    );
    const shareUrl = `${appUrl}/t/${shareCode}`;

    // Check if a share record already exists
    const existing = await prisma.participants_share.findFirst({
      where: {
        campaign_id: campaignId,
        participant_id: participantId,
        social_type: socialTypeId,
      },
    });

    if (existing) {
      // Update the existing share record URL
      await prisma.participants_share.update({
        where: { id: existing.id },
        data: { url: shareUrl },
      });
    } else {
      // Create new share record
      await prisma.participants_share.create({
        data: {
          campaign_id: campaignId,
          participant_id: participantId,
          social_type: socialTypeId,
          clicks: 0,
          url: shareUrl,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        shareUrl,
        socialType: socialTypeId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/share] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function resolveSocialType(
  socialType: string | number
): Promise<number | null> {
  if (typeof socialType === "number") return socialType;

  const parsed = parseInt(String(socialType), 10);
  if (!isNaN(parsed)) return parsed;

  // Map common names to IDs
  const nameMap: Record<string, number> = {
    facebook: 1,
    twitter: 2,
    linkedin: 3,
    email: 4,
    whatsapp: 5,
  };

  if (nameMap[socialType.toLowerCase()]) {
    return nameMap[socialType.toLowerCase()];
  }

  // Look up in DB
  const social = await prisma.social_types.findFirst({
    where: { name: socialType },
  });
  return social?.id ?? null;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptShareCode, parseShareCode } from "@/lib/encryption";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/click
 *
 * Track a click via AJAX (alternative to /t/ redirect).
 * Body: { code } - The encrypted share code
 *   OR: { campaignId, participantId, socialType } - Direct params
 */
export async function POST(request: NextRequest) {
  try {
    // Generous per-IP cap to curb automated click inflation. Fails open.
    if (!rateLimit(`click:${clientIp(request)}`, 100, 60_000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();

    let campaignId: number;
    let participantId: number;
    let socialTypeId: number;

    if (body.code) {
      // Decrypt share code
      const decrypted = decryptShareCode(body.code);
      const parsed = parseShareCode(decrypted);
      campaignId = parsed.campaignId;
      participantId = parsed.participantId;

      const socialParsed = parseInt(parsed.socialType, 10);
      socialTypeId = isNaN(socialParsed) ? 1 : socialParsed;
    } else if (body.campaignId && body.participantId) {
      campaignId = body.campaignId;
      participantId = body.participantId;
      socialTypeId = body.socialType || 1;
    } else {
      return NextResponse.json(
        { error: "Either code or campaignId+participantId required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Increment click count on the share record
    const updated = await prisma.participants_share.updateMany({
      where: {
        campaign_id: campaignId,
        participant_id: participantId,
        social_type: socialTypeId,
      },
      data: {
        clicks: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        success: true,
        updated: updated.count,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/click] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/impression
 *
 * Track a widget impression (page view).
 * Body: { campaignId }
 * Increments the impression count for the campaign.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const urlViewed = request.headers.get("referer") || null;

    // Record individual impression
    await prisma.campaign_widget_impressions.create({
      data: {
        campaign_id: campaignId,
        ip_address: ip,
        url_viewed: urlViewed,
      },
    });

    // Increment aggregated impression count
    const existing = await prisma.campaign_widget_impressions_count.findUnique({
      where: { campaign_id: campaignId },
    });

    if (existing) {
      await prisma.campaign_widget_impressions_count.update({
        where: { campaign_id: campaignId },
        data: { views: { increment: 1 } },
      });
    } else {
      await prisma.campaign_widget_impressions_count.create({
        data: {
          campaign_id: campaignId,
          views: 1,
        },
      });
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/impression] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

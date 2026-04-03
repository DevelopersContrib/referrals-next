import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all distinct campaign IDs from impressions table
    const campaignImpressions = await prisma.campaign_widget_impressions.groupBy({
      by: ["campaign_id"],
      _count: { id: true },
    });

    let updated = 0;

    for (const item of campaignImpressions) {
      const campaignId = item.campaign_id;
      const totalViews = BigInt(item._count.id);

      // Upsert the impression count record
      const existing = await prisma.campaign_widget_impressions_count.findFirst({
        where: { campaign_id: campaignId },
      });

      if (existing) {
        await prisma.campaign_widget_impressions_count.update({
          where: { id: existing.id },
          data: { views: totalViews },
        });
      } else {
        await prisma.campaign_widget_impressions_count.create({
          data: {
            campaign_id: campaignId,
            views: totalViews,
          },
        });
      }

      updated++;
    }

    return NextResponse.json({
      success: true,
      campaigns_updated: updated,
    });
  } catch (error) {
    console.error("Update impressions cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

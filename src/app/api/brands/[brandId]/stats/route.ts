import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBrandIfAccessible } from "@/lib/brand-access";
import {
  getBrandOverviewStats,
  getBrandParticipantsSeries,
  getBrandSharesSeries,
} from "@/lib/brand-stats";

type RouteParams = { params: Promise<{ brandId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    const brand = await getBrandIfAccessible(
      id,
      memberId,
      Boolean((session.user as { isAdmin?: boolean }).isAdmin)
    );

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const graph = searchParams.get("graph");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (graph && from && to) {
      try {
        if (graph === "1") {
          const stats = await getBrandOverviewStats(id, from, to);
          return NextResponse.json({ graph: "1", ...stats });
        }
        if (graph === "2") {
          const series = await getBrandParticipantsSeries(id, from, to);
          return NextResponse.json({ graph: "2", series });
        }
        if (graph === "3") {
          const series = await getBrandSharesSeries(id, from, to);
          return NextResponse.json({ graph: "3", series });
        }
      } catch (err) {
        return NextResponse.json(
          {
            error:
              err instanceof Error ? err.message : "Invalid stats request",
          },
          { status: 400 }
        );
      }
    }

    const range = from && to ? { from, to } : null;
    const stats = range
      ? await getBrandOverviewStats(id, range.from, range.to)
      : await getBrandOverviewStats(
          id,
          new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10)
        );

    return NextResponse.json({
      campaignsCount: stats.totalCampaigns,
      participantsCount: stats.totalParticipants,
      totalClicks: stats.totalClicks,
      totalShares: stats.totalShares,
      totalImpressions: stats.totalImpressions,
    });
  } catch (error) {
    console.error("Error fetching brand stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand stats" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const __adminGate = await requirePlatformAdminApi();
  if (!__adminGate.ok)
    return NextResponse.json(
      { error: __adminGate.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: __adminGate.status }
    );
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      totalMembers,
      totalBrands,
      totalCampaigns,
      totalParticipants,
      payments,
    ] = await Promise.all([
      prisma.members.count(),
      prisma.member_urls.count(),
      prisma.member_campaigns.count(),
      prisma.campaign_participants.count(),
      prisma.member_payment.aggregate({ _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      totalMembers,
      totalBrands,
      totalCampaigns,
      totalParticipants,
      totalRevenue: payments._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

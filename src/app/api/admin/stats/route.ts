import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

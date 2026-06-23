import { NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
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

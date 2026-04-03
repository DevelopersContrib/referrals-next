import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const id = parseInt(campaignId, 10);

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id, member_id: memberId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const participants = await prisma.campaign_participants.findMany({
      where: { campaign_id: id },
      orderBy: { date_signedup: "desc" },
    });

    // Get share data
    const participantIds = participants.map((p) => p.id);
    const shares = await prisma.participants_share.groupBy({
      by: ["participant_id"],
      where: {
        campaign_id: id,
        participant_id: { in: participantIds },
      },
      _count: { id: true },
      _sum: { clicks: true },
    });

    const shareMap = new Map(
      shares.map((s) => [
        s.participant_id,
        { shares: s._count.id, clicks: s._sum.clicks || 0 },
      ])
    );

    // Get referral counts
    const referralCounts = await prisma.campaign_participants.groupBy({
      by: ["invited_by"],
      where: {
        campaign_id: id,
        invited_by: { in: participantIds },
      },
      _count: { id: true },
    });
    const referralMap = new Map(
      referralCounts.map((r) => [r.invited_by, r._count.id])
    );

    // Build CSV
    const headers = [
      "Name",
      "Email",
      "Date Joined",
      "Shares",
      "Clicks",
      "Referrals",
      "Wallet Address",
      "IP Address",
      "Signup URL",
      "Referral URL",
    ];

    const rows = participants.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.email || "").replace(/"/g, '""')}"`,
      p.date_signedup.toISOString(),
      String(shareMap.get(p.id)?.shares || 0),
      String(shareMap.get(p.id)?.clicks || 0),
      String(referralMap.get(p.id) || 0),
      `"${(p.wallet_address || "").replace(/"/g, '""')}"`,
      `"${(p.ip_address || "").replace(/"/g, '""')}"`,
      `"${(p.signup_url || "").replace(/"/g, '""')}"`,
      `"${(p.referral_url || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="campaign-${id}-participants.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting participants:", error);
    return NextResponse.json(
      { error: "Failed to export participants" },
      { status: 500 }
    );
  }
}

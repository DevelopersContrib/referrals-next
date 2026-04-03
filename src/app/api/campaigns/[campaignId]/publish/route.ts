import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const newStatus = body.publish || (campaign.publish === "public" ? "private" : "public");

    const updated = await prisma.member_campaigns.update({
      where: { id },
      data: { publish: newStatus },
    });

    return NextResponse.json({
      publish: updated.publish,
      message: `Campaign is now ${updated.publish}`,
    });
  } catch (error) {
    console.error("Error toggling publish:", error);
    return NextResponse.json(
      { error: "Failed to update publish status" },
      { status: 500 }
    );
  }
}

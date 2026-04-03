import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ campaignId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });

    const campaign = await prisma.member_campaigns.findUnique({ where: { id } });
    if (!campaign)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.type_id !== undefined) data.type_id = body.type_id;
    if (body.publish !== undefined) data.publish = body.publish;
    if (body.goal_type !== undefined) data.goal_type = body.goal_type;
    if (body.num_visits !== undefined) data.num_visits = body.num_visits;
    if (body.num_signups !== undefined) data.num_signups = body.num_signups;
    if (body.allow_email !== undefined) data.allow_email = body.allow_email;
    if (body.reward_type !== undefined) data.reward_type = body.reward_type;

    const updated = await prisma.member_campaigns.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await params;
    const id = parseInt(campaignId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });

    await prisma.member_campaigns.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

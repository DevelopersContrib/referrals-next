import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ contestId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const { contestId } = await params;
    const id = parseInt(contestId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });

    const contest = await prisma.campaign_contest.findUnique({ where: { id } });
    if (!contest)
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });

    return NextResponse.json(contest);
  } catch (error) {
    console.error("Error fetching contest:", error);
    return NextResponse.json(
      { error: "Failed to fetch contest" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { contestId } = await params;
    const id = parseInt(contestId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });

    const existing = await prisma.campaign_contest.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });

    const body = await req.json();
    const {
      campaign_id,
      contest_name,
      contest_type_id,
      description,
      start_date,
      end_date,
      member_id,
      max_winners,
      max_display,
      is_on,
      winner_email,
    } = body;

    const data: Record<string, unknown> = {};
    if (campaign_id !== undefined) data.campaign_id = parseInt(campaign_id, 10);
    if (contest_name !== undefined) data.contest_name = contest_name;
    if (contest_type_id !== undefined)
      data.contest_type_id = parseInt(contest_type_id, 10);
    if (description !== undefined) data.description = description || null;
    if (start_date !== undefined) data.start_date = start_date || null;
    if (end_date !== undefined) data.end_date = end_date || null;
    if (member_id !== undefined) data.member_id = parseInt(member_id, 10);
    if (max_winners !== undefined) data.max_winners = parseInt(max_winners, 10);
    if (max_display !== undefined) data.max_display = parseInt(max_display, 10);
    if (is_on !== undefined) data.is_on = is_on;
    if (winner_email !== undefined) data.winner_email = winner_email || null;

    const updated = await prisma.campaign_contest.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating contest:", error);
    return NextResponse.json(
      { error: "Failed to update contest" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

    const { contestId } = await params;
    const id = parseInt(contestId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });

    await prisma.campaign_contest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contest:", error);
    return NextResponse.json(
      { error: "Failed to delete contest" },
      { status: 500 }
    );
  }
}

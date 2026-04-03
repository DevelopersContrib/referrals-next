import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ planId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId } = await params;
    const id = parseInt(planId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });

    const plan = await prisma.plans.findUnique({ where: { id } });
    if (!plan)
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId } = await params;
    const id = parseInt(planId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });

    const body = await req.json();
    const {
      name,
      price,
      campaigns_participants,
      no_of_domains,
      unit,
      no_unit,
      days,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = parseFloat(price);
    if (campaigns_participants !== undefined)
      data.campaigns_participants = parseInt(campaigns_participants, 10);
    if (no_of_domains !== undefined)
      data.no_of_domains = parseInt(no_of_domains, 10);
    if (unit !== undefined) data.unit = unit;
    if (no_unit !== undefined) data.no_unit = parseInt(no_unit, 10);
    if (days !== undefined) data.days = parseInt(days, 10);

    const updated = await prisma.plans.update({ where: { id }, data });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId } = await params;
    const id = parseInt(planId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });

    // Check if any members are on this plan
    const memberCount = await prisma.members.count({
      where: { plan_id: id },
    });

    if (memberCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan with ${memberCount} active subscriber(s). Reassign them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.plans.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ dealId: string }> };

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

    const { dealId } = await params;
    const id = parseInt(dealId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

    const deal = await prisma.brand_deals.findUnique({ where: { id } });
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
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

    const { dealId } = await params;
    const id = parseInt(dealId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

    const existing = await prisma.brand_deals.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const body = await req.json();
    const {
      category_id,
      url_id,
      member_id,
      title,
      description,
      price,
      banner,
      url,
      how_to,
      date_end,
    } = body;

    const data: Record<string, unknown> = {};
    if (category_id !== undefined) data.category_id = parseInt(category_id, 10);
    if (url_id !== undefined) data.url_id = parseInt(url_id, 10);
    if (member_id !== undefined) data.member_id = parseInt(member_id, 10);
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (price !== undefined) data.price = price || null;
    if (banner !== undefined) data.banner = banner || null;
    if (url !== undefined) data.url = url || null;
    if (how_to !== undefined) data.how_to = how_to || null;
    if (date_end !== undefined) data.date_end = date_end || null;

    const updated = await prisma.brand_deals.update({ where: { id }, data });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
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

    const { dealId } = await params;
    const id = parseInt(dealId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });

    await prisma.brand_deals.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}

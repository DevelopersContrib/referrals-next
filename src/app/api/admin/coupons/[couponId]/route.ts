import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ couponId: string }> };

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

    const { couponId } = await params;
    const id = parseInt(couponId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });

    const coupon = await prisma.campaign_coupons.findUnique({ where: { id } });
    if (!coupon)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
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

    const { couponId } = await params;
    const id = parseInt(couponId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });

    const existing = await prisma.campaign_coupons.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    const body = await req.json();
    const { campaign_id, code, is_used } = body;

    const data: Record<string, unknown> = {};
    if (campaign_id !== undefined) {
      const campaignId = parseInt(campaign_id, 10);
      if (isNaN(campaignId))
        return NextResponse.json(
          { error: "Invalid campaign ID" },
          { status: 400 }
        );
      data.campaign_id = campaignId;
    }
    if (code !== undefined) data.code = code || null;
    if (is_used !== undefined) data.is_used = is_used;

    const updated = await prisma.campaign_coupons.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
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

    const { couponId } = await params;
    const id = parseInt(couponId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });

    await prisma.campaign_coupons.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}

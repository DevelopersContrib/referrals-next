import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId } = await params;
  const deal = await prisma.brand_deals.findUnique({
    where: { id: parseInt(dealId, 10) },
  });

  if (!deal || deal.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ deal });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId } = await params;
  const deal = await prisma.brand_deals.findUnique({
    where: { id: parseInt(dealId, 10) },
  });

  if (!deal || deal.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.brand_deals.update({
    where: { id: parseInt(dealId, 10) },
    data: {
      title: body.title,
      description: body.description,
      url: body.url,
      how_to: body.coupon_code,
    },
  });

  return NextResponse.json({ deal: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId } = await params;
  const deal = await prisma.brand_deals.findUnique({
    where: { id: parseInt(dealId, 10) },
  });

  if (!deal || deal.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.brand_deals.delete({ where: { id: parseInt(dealId, 10) } });

  return NextResponse.json({ success: true });
}

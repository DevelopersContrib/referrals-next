import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId)
    return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const brand = await prisma.member_urls.findUnique({
    where: { id: parseInt(brandId, 10) },
  });
  if (!brand || brand.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deals = await prisma.brand_deals.findMany({
    where: { url_id: parseInt(brandId, 10) },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ deals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { brandId, title, description, link, coupon_code } = body;

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
  });
  if (!brand || brand.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deal = await prisma.brand_deals.create({
    data: {
      url_id: brandId,
      member_id: parseInt(session.user.id, 10),
      title,
      description,
      url: link || "",
      how_to: coupon_code || "",
      category_id: 0,
    },
  });

  return NextResponse.json({ deal }, { status: 201 });
}

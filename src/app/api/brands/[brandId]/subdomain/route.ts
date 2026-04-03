import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;
  const subdomain = await prisma.brand_subdomains.findFirst({
    where: { url_id: parseInt(brandId, 10) },
  });

  return NextResponse.json({ subdomain });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;
  const brand = await prisma.member_urls.findUnique({
    where: { id: parseInt(brandId, 10) },
  });

  if (!brand || brand.member_id !== parseInt(session.user.id, 10))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { subdomain } = await req.json();

  if (!subdomain || subdomain.length < 3) {
    return NextResponse.json(
      { error: "Subdomain must be at least 3 characters" },
      { status: 400 }
    );
  }

  // Check if subdomain is taken
  const existing = await prisma.brand_subdomains.findFirst({
    where: { subdomain, url_id: { not: parseInt(brandId, 10) } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Subdomain already taken" },
      { status: 409 }
    );
  }

  const existingSub = await prisma.brand_subdomains.findFirst({ where: { url_id: parseInt(brandId, 10) } });

  let result;
  if (existingSub) {
    result = await prisma.brand_subdomains.update({
      where: { id: existingSub.id },
      data: { subdomain },
    });
  } else {
    result = await prisma.brand_subdomains.create({
      data: { url_id: parseInt(brandId, 10), subdomain, created_by: parseInt(session.user.id, 10) },
    });
  }

  return NextResponse.json({ subdomain: result });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ brandId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { brandId } = await params;
    const id = parseInt(brandId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });

    const brand = await prisma.member_urls.findUnique({ where: { id } });
    if (!brand)
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { brandId } = await params;
    const id = parseInt(brandId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });

    const existing = await prisma.member_urls.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.url !== undefined) {
      data.url = body.url;
      try {
        data.domain = new URL(body.url).hostname;
      } catch {
        data.domain = body.url.replace(/^https?:\/\//, "").split("/")[0];
      }
    }
    if (body.description !== undefined) data.description = body.description;
    if (body.logo_url !== undefined) data.logo_url = body.logo_url;
    if (body.background_image !== undefined) data.background_image = body.background_image;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.member_id !== undefined) data.member_id = body.member_id;

    const updated = await prisma.member_urls.update({ where: { id }, data });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { brandId } = await params;
    const id = parseInt(brandId, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });

    await prisma.member_urls.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}

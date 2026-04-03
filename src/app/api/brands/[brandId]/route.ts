import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ brandId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    const brand = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

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

    const memberId = parseInt(session.user.id, 10);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await req.json();
    const { url, description, logo_url, background_image, slug } = body;

    // If URL changed, re-extract domain
    let domain = existing.domain;
    if (url && url !== existing.url) {
      try {
        domain = new URL(url).hostname;
      } catch {
        domain = url.replace(/^https?:\/\//, "").split("/")[0];
      }
    }

    const updated = await prisma.member_urls.update({
      where: { id },
      data: {
        ...(url !== undefined && { url, domain }),
        ...(description !== undefined && { description }),
        ...(logo_url !== undefined && { logo_url }),
        ...(background_image !== undefined && { background_image }),
        ...(slug !== undefined && { slug }),
      },
    });

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

    const memberId = parseInt(session.user.id, 10);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.member_urls.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

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

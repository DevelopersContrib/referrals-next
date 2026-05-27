import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractDomainFromUrl,
  getBrandIfAccessible,
  userCanAccessBrand,
} from "@/lib/brand-access";

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

    const brand = await getBrandIfAccessible(
      id,
      memberId,
      Boolean((session.user as { isAdmin?: boolean }).isAdmin)
    );

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
    const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    const existing = await getBrandIfAccessible(id, memberId, isAdmin);
    if (!existing) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const body = await req.json();
    const { url, description, logo_url, background_image, slug } = body;

    let domain = existing.domain;
    if (url && url !== existing.url) {
      domain = extractDomainFromUrl(url);

      const duplicate = await prisma.member_urls.findFirst({
        where: { domain, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "This domain is already registered" },
          { status: 409 }
        );
      }
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.member_urls.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "Slug is not available" },
          { status: 409 }
        );
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
    const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
    const { brandId } = await params;
    const id = parseInt(brandId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });
    }

    const canAccess = await userCanAccessBrand(id, memberId, isAdmin);
    if (!canAccess) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.url_socials.deleteMany({ where: { url_id: id } }),
      prisma.member_campaigns.deleteMany({ where: { url_id: id } }),
      prisma.member_urls.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}

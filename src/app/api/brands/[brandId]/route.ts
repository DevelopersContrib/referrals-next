import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractDomainFromUrl,
  getBrandIfAccessible,
  userCanAccessBrand,
} from "@/lib/brand-access";
import { guardBrandSlug } from "@/lib/brand-slug-guard";

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
      Boolean((session.user as { isAdmin?: boolean }).isAdmin),
    );

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 },
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
    const {
      url,
      description,
      logo_url,
      background_image,
      slug,
      brand_colors,
      referral_campaign_id,
    } = body;

    // Normalize the referral campaign choice: a positive int, or null to clear.
    let referralCampaignId: number | null | undefined;
    if (referral_campaign_id === null || referral_campaign_id === "") {
      referralCampaignId = null;
    } else if (referral_campaign_id !== undefined) {
      const n = Number(referral_campaign_id);
      referralCampaignId = Number.isFinite(n) && n > 0 ? n : null;
    }

    // Sanitize brand_colors: only known roles, only valid #rrggbb hex values.
    let brandColors: Record<string, string> | null | undefined;
    if (brand_colors === null) {
      brandColors = null;
    } else if (brand_colors && typeof brand_colors === "object") {
      const roles = ["primary", "secondary", "accent", "background", "text"];
      const clean: Record<string, string> = {};
      for (const role of roles) {
        const v = (brand_colors as Record<string, unknown>)[role];
        if (typeof v === "string") {
          const s = v.trim().replace(/^#/, "");
          if (/^[0-9a-fA-F]{6}$/.test(s)) clean[role] = `#${s.toLowerCase()}`;
        }
      }
      brandColors = Object.keys(clean).length > 0 ? clean : null;
    }

    let domain = existing.domain;
    if (url && url !== existing.url) {
      domain = extractDomainFromUrl(url);

      const duplicate = await prisma.member_urls.findFirst({
        where: { domain, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "This domain is already registered" },
          { status: 409 },
        );
      }
    }

    let nextSlug: string | undefined;
    if (slug !== undefined && slug !== existing.slug) {
      const slugGuard = await guardBrandSlug({
        slug,
        website: url ?? existing.url,
        excludeBrandId: id,
      });
      if (!slugGuard.ok) return slugGuard.response;
      nextSlug = slugGuard.slug || undefined;
    }

    const updated = await prisma.member_urls.update({
      where: { id },
      data: {
        ...(url !== undefined && { url, domain }),
        ...(description !== undefined && { description }),
        ...(logo_url !== undefined && { logo_url }),
        ...(background_image !== undefined && { background_image }),
        ...(nextSlug !== undefined && { slug: nextSlug }),
        ...(brandColors && { brand_colors: brandColors }),
        ...(referralCampaignId !== undefined && {
          referral_campaign_id: referralCampaignId,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 },
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
      { status: 500 },
    );
  }
}

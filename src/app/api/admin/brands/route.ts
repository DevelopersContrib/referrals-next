import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";
import { claimBrandSlug } from "@/lib/brand-access";
import { guardBrandSlug } from "@/lib/brand-slug-guard";

export async function GET(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [{ url: { contains: search } }, { domain: { contains: search } }],
        }
      : {};

    const [brands, total] = await Promise.all([
      prisma.member_urls.findMany({
        where,
        orderBy: { date_added: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member_urls.count({ where }),
    ]);

    return NextResponse.json({
      brands,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { url, member_id } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (member_id === undefined || member_id === null || member_id === "") {
      return NextResponse.json(
        { error: "Member is required" },
        { status: 400 },
      );
    }

    let domain: string;
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url.replace(/^https?:\/\//, "").split("/")[0];
    }

    const slugGuard = await guardBrandSlug({ slug: body.slug, website: url });
    if (!slugGuard.ok) return slugGuard.response;

    const created = await prisma.member_urls.create({
      data: {
        url,
        domain,
        member_id: parseInt(member_id, 10),
        description: body.description ?? null,
        logo_url: body.logo_url ?? null,
        background_image: body.background_image ?? null,
      },
    });
    const slug = await claimBrandSlug(created.id, slugGuard.slug, domain);

    return NextResponse.json({ ...created, slug }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 },
    );
  }
}

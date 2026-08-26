import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canMemberAddBrand,
  subscriptionRequiredResponse,
} from "@/lib/member-subscription";
import { claimBrandSlug } from "@/lib/brand-access";
import { guardBrandSlug } from "@/lib/brand-slug-guard";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);

    const brands = await prisma.member_urls.findMany({
      where: { member_id: memberId },
      orderBy: { date_added: "desc" },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);
    const body = await req.json();

    const { url, description, slug } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const canAdd = await canMemberAddBrand(memberId);
    if (!canAdd.ok) {
      return subscriptionRequiredResponse(
        "Free accounts include 1 domain. Start or renew Growth ($9/mo per brand) to add another.",
      );
    }

    const slugGuard = await guardBrandSlug({ slug, website: url });
    if (!slugGuard.ok) return slugGuard.response;

    // Extract domain from URL
    let domain = "";
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url.replace(/^https?:\/\//, "").split("/")[0];
    }

    const created = await prisma.member_urls.create({
      data: {
        url,
        description: description || null,
        member_id: memberId,
        domain,
      },
    });
    const claimed = await claimBrandSlug(created.id, slugGuard.slug, domain);

    return NextResponse.json({ ...created, slug: claimed }, { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 },
    );
  }
}

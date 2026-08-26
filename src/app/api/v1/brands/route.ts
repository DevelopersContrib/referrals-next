import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
  getPagination,
} from "@/lib/api/helpers";
import { canMemberAddBrand } from "@/lib/member-subscription";
import { checkBrandSlug, claimBrandSlug } from "@/lib/brand-access";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { page, limit, skip } = getPagination(req);

    const [brands, total] = await Promise.all([
      prisma.member_urls.findMany({
        where: { member_id: memberId },
        orderBy: { date_added: "desc" },
        skip,
        take: limit,
      }),
      prisma.member_urls.count({ where: { member_id: memberId } }),
    ]);

    return apiSuccess({
      brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List brands error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const body = await req.json();
    const { url, description, slug } = body;

    if (!url) {
      return apiError("URL is required", 400);
    }

    const canAdd = await canMemberAddBrand(memberId);
    if (!canAdd.ok) {
      return apiError(
        "Free accounts include 1 domain. Upgrade to Growth ($9/mo per brand) to add another.",
        403,
      );
    }

    if (slug) {
      const check = await checkBrandSlug({ slug, website: url });
      if (!check.available) {
        return apiError(
          `${check.message} Try "${check.suggestion}".`,
          check.reason === "taken" ? 409 : 400,
        );
      }
    }

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
    const claimed = await claimBrandSlug(created.id, slug, domain);

    return apiSuccess({ ...created, slug: claimed }, 201);
  } catch (error) {
    console.error("Create brand error:", error);
    return apiError("Internal server error", 500);
  }
}

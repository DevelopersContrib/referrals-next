import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
  getPagination,
} from "@/lib/api/helpers";
import { isMemberOnPaidPlan } from "@/lib/member-subscription";

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
    const url = new URL(req.url);
    const brandId = url.searchParams.get("brand_id");

    const where: Record<string, unknown> = { member_id: memberId };
    if (brandId) {
      where.url_id = parseInt(brandId, 10);
    }

    const [campaigns, total] = await Promise.all([
      prisma.member_campaigns.findMany({
        where,
        orderBy: { date_added: "desc" },
        skip,
        take: limit,
      }),
      prisma.member_campaigns.count({ where }),
    ]);

    return apiSuccess({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List campaigns error:", error);
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
    const { name, url_id, type_id, reward_type, goal_type, num_signups, publish } = body;

    if (!name || !url_id) {
      return apiError("Name and url_id (brand) are required", 400);
    }

    // Verify brand belongs to member
    const brand = await prisma.member_urls.findFirst({
      where: { id: url_id, member_id: memberId },
    });

    if (!brand) {
      return apiError("Brand not found or does not belong to you", 404);
    }

    const paid = await isMemberOnPaidPlan(memberId);
    const resolvedPublish =
      publish === "public" || publish === "private"
        ? publish
        : paid
          ? "public"
          : "private";
    if (resolvedPublish === "public" && !paid) {
      return apiError(
        "An active subscription is required to publish referral programs.",
        403
      );
    }

    const campaign = await prisma.member_campaigns.create({
      data: {
        name,
        url_id,
        member_id: memberId,
        type_id: type_id || 1,
        reward_type: reward_type || 1,
        goal_type: goal_type || undefined,
        num_signups: num_signups || undefined,
        publish: resolvedPublish,
        date_added: new Date(),
      },
    });

    return apiSuccess(campaign, 201);
  } catch (error) {
    console.error("Create campaign error:", error);
    return apiError("Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
  getPagination,
} from "@/lib/api/helpers";

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

    const [webhooks, total] = await Promise.all([
      prisma.member_zapier.findMany({
        where: { member_id: memberId },
        skip,
        take: limit,
      }),
      prisma.member_zapier.count({ where: { member_id: memberId } }),
    ]);

    return apiSuccess({
      webhooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List webhooks error:", error);
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
    const { link, message, campaign_id } = body;

    if (!link) {
      return apiError("Webhook URL (link) is required", 400);
    }

    // Validate URL
    try {
      new URL(link);
    } catch {
      return apiError("Invalid webhook URL", 400);
    }

    const webhook = await prisma.member_zapier.create({
      data: {
        member_id: memberId,
        link,
        message: message || null,
        campaign_id: campaign_id || null,
      },
    });

    return apiSuccess(webhook, 201);
  } catch (error) {
    console.error("Create webhook error:", error);
    return apiError("Internal server error", 500);
  }
}

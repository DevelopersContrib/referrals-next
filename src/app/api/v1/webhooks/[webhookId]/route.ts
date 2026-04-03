import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { webhookId } = await params;
    const id = parseInt(webhookId, 10);

    const existing = await prisma.member_zapier.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Webhook not found", 404);
    }

    const body = await req.json();
    const { link, message, campaign_id } = body;

    const updated = await prisma.member_zapier.update({
      where: { id },
      data: {
        ...(link !== undefined && { link }),
        ...(message !== undefined && { message }),
        ...(campaign_id !== undefined && { campaign_id }),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Update webhook error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const { webhookId } = await params;
    const id = parseInt(webhookId, 10);

    const existing = await prisma.member_zapier.findFirst({
      where: { id, member_id: memberId },
    });

    if (!existing) {
      return apiError("Webhook not found", 404);
    }

    await prisma.member_zapier.delete({ where: { id } });

    return apiSuccess({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Delete webhook error:", error);
    return apiError("Internal server error", 500);
  }
}

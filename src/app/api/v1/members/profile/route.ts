import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const member = await prisma.members.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        name: true,
        is_verified: true,
        plan_id: true,
        plan_expiry: true,
        date_signedup: true,
        photo: true,
        num_of_logins: true,
      },
    });

    if (!member) {
      return apiError("Member not found", 404);
    }

    return apiSuccess(member);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return apiError("Internal server error", 500);
  }
}

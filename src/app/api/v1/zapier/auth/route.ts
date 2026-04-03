import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

/**
 * Zapier authentication test endpoint.
 * Zapier sends the API key to verify it is valid during the "Test Authentication" step.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return apiError("API key is required in X-API-Key header", 401);
    }

    const key = await prisma.member_keys.findFirst({
      where: { api_key: apiKey },
    });

    if (!key) {
      return apiError("Invalid API key", 401);
    }

    const member = await prisma.members.findUnique({
      where: { id: key.userid },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!member) {
      return apiError("Member not found", 404);
    }

    return apiSuccess({
      authenticated: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
      },
    });
  } catch (error) {
    console.error("Zapier auth error:", error);
    return apiError("Internal server error", 500);
  }
}

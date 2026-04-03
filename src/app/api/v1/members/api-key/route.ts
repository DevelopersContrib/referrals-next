import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { authenticateApiKey, apiSuccess, apiError, handleCors } from "@/lib/api/helpers";
import { auth } from "@/lib/auth";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    // Allow both session auth and API key auth
    let memberId: number | null = null;

    const session = await auth();
    if (session?.user?.id) {
      memberId = parseInt(session.user.id, 10);
    } else {
      memberId = await authenticateApiKey(req);
    }

    if (!memberId) {
      return apiError("Unauthorized", 401);
    }

    const key = await prisma.member_keys.findFirst({
      where: { userid: memberId },
      orderBy: { date_generated: "desc" },
    });

    if (!key) {
      return apiError("No API key found. Generate one first.", 404);
    }

    return apiSuccess({
      api_key: key.api_key,
      date_generated: key.date_generated,
    });
  } catch (error) {
    console.error("Get API key error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Allow both session auth and API key auth
    let memberId: number | null = null;

    const session = await auth();
    if (session?.user?.id) {
      memberId = parseInt(session.user.id, 10);
    } else {
      memberId = await authenticateApiKey(req);
    }

    if (!memberId) {
      return apiError("Unauthorized", 401);
    }

    const newApiKey = `ref_${randomBytes(24).toString("hex")}`;

    const key = await prisma.member_keys.create({
      data: {
        api_key: newApiKey,
        userid: memberId,
        date_generated: new Date(),
      },
    });

    return apiSuccess(
      {
        api_key: key.api_key,
        date_generated: key.date_generated,
      },
      201
    );
  } catch (error) {
    console.error("Generate API key error:", error);
    return apiError("Internal server error", 500);
  }
}

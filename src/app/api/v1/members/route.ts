import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

export async function OPTIONS() {
  return handleCors();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return apiError("Email, name, and password are required", 400);
    }

    // Check for existing member
    const existing = await prisma.members.findFirst({
      where: { email },
    });

    if (existing) {
      return apiError("A member with this email already exists", 409);
    }

    const hashedPassword = hashSync(password, 10);

    const member = await prisma.members.create({
      data: {
        email,
        name,
        password: hashedPassword,
        is_verified: false,
        date_signedup: new Date(),
      },
    });

    return apiSuccess(
      {
        id: member.id,
        email: member.email,
        name: member.name,
        date_signedup: member.date_signedup,
      },
      201
    );
  } catch (error) {
    console.error("Member registration error:", error);
    return apiError("Internal server error", 500);
  }
}

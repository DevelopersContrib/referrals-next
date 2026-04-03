import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { compareSync } from "bcryptjs";
import { createHmac } from "crypto";
import { apiSuccess, apiError, handleCors } from "@/lib/api/helpers";

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 30 * 24 * 60 * 60
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

export async function OPTIONS() {
  return handleCors();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("Email and password are required", 400);
    }

    const member = await prisma.members.findFirst({
      where: { email },
    });

    if (!member || !member.password) {
      return apiError("Invalid credentials", 401);
    }

    // Try bcrypt first, then plain text (legacy PHP compatibility)
    let isValid = false;
    try {
      isValid = compareSync(password, member.password);
    } catch {
      // bcrypt may throw on non-hash strings
    }

    if (!isValid) {
      if (password !== member.password) {
        return apiError("Invalid credentials", 401);
      }
    }

    // Generate JWT token
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret";
    const token = signJwt(
      {
        sub: String(member.id),
        email: member.email,
        name: member.name,
      },
      secret
    );

    return apiSuccess({
      token,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
      },
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    return apiError("Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import {
  apiSuccess,
  apiError,
  authenticateApiKey,
  handleCors,
  readJsonBody,
  invalidJsonError,
} from "@/lib/api/helpers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleCors();
}

const HOUR = 60 * 60 * 1000;

/**
 * Create a member account for an API client. Requires an X-API-Key: people
 * signing up in the browser use /api/auth/register (Turnstile-protected).
 * The response is the same whether or not the email already has an account,
 * so this can't be used to find out who is registered.
 */
export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`v1-members:ip:${clientIp(req)}`, 20, HOUR)) {
      return apiError("Too many requests. Please try again later.", 429);
    }

    const callerId = await authenticateApiKey(req);
    if (!callerId) {
      return apiError("A valid X-API-Key header is required", 401);
    }
    if (!rateLimit(`v1-members:key:${callerId}`, 20, HOUR)) {
      return apiError("Too many requests. Please try again later.", 429);
    }

    const parsed = await readJsonBody(req);
    if (!parsed.ok) return invalidJsonError();
    const { email, name, password } = parsed.body;

    if (
      typeof email !== "string" ||
      typeof name !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !name.trim() ||
      !password
    ) {
      return apiError("Email, name, and password are required", 400);
    }
    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", 400);
    }

    const cleanEmail = email.trim();
    // Hash either way so both outcomes take about the same time.
    const hashedPassword = hashSync(password, 10);
    const existing = await prisma.members.findFirst({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (!existing) {
      await prisma.members.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          password: hashedPassword,
          is_verified: false,
          date_signedup: new Date(),
        },
      });
    }

    return apiSuccess(
      {
        email: cleanEmail,
        message: "Request received. If this email is new, the account has been created.",
      },
      202
    );
  } catch (error) {
    console.error("Member registration error:", error);
    return apiError("Internal server error", 500);
  }
}

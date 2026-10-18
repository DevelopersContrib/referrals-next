import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/ses";

/** Best-effort per-instance throttle: one resend per member per minute. */
const lastSent = new Map<number, number>();
const MIN_INTERVAL_MS = 60_000;

/** Send a fresh verification link to the signed-in member. */
export async function POST() {
  const session = await auth();
  const memberId = session?.user?.id ? parseInt(session.user.id, 10) : NaN;
  if (!Number.isFinite(memberId)) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { email: true, is_verified: true },
  });
  if (!member?.email) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (member.is_verified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const now = Date.now();
  const prev = lastSent.get(memberId) ?? 0;
  if (now - prev < MIN_INTERVAL_MS) {
    return NextResponse.json(
      { error: "We just sent one. Check your inbox and spam folder, then try again in a minute." },
      { status: 429 }
    );
  }
  lastSent.set(memberId, now);

  const code = randomBytes(32).toString("hex");
  await prisma.members.update({
    where: { id: memberId },
    data: { verification_code: code },
  });

  try {
    await sendVerificationEmail(member.email, code);
  } catch (error) {
    console.error("[resend-verification] send failed:", error);
    return NextResponse.json(
      { error: "We couldn't send the email. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

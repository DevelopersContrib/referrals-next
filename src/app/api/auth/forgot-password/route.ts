import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/ses";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Without a cap this doubles as an email bomb and a brute-force surface.
    if (!rateLimit(`forgot:${clientIp(request)}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const member = await prisma.members.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!member) {
      return NextResponse.json({ success: true });
    }

    // Generate a random reset code
    const code = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store the code in verification_code field
    await prisma.members.update({
      where: { id: member.id },
      data: { verification_code: code },
    });

    // Send after responding, so neither a send failure nor the time SES takes
    // can distinguish a registered address from an unknown one.
    after(async () => {
      try {
        await sendPasswordResetEmail(member.email, code);
      } catch (sendError) {
        console.error("[forgot-password] reset email failed to send:", sendError);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

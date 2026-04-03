import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/ses";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, website } = await req.json();

    if (!name || !email || !password || !website) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.members.findFirst({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create member
    const verificationCode = randomBytes(32).toString("hex");
    const hashedPassword = hashSync(password, 12);

    // Extract domain from website URL
    let domain = "";
    try {
      domain = new URL(website).hostname;
    } catch {
      domain = website.replace(/^https?:\/\//, "").split("/")[0];
    }

    const member = await prisma.members.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verification_code: verificationCode,
        is_verified: false,
        date_signedup: new Date(),
        num_of_logins: 0,
      },
    });

    // Create first brand
    await prisma.member_urls.create({
      data: {
        url: website,
        member_id: member.id,
        domain,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      memberId: member.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

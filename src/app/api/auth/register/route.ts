import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/ses";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, website } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
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

    // Optionally create the first brand if a website was provided.
    // (Website is collected during post-signup onboarding, not at signup.)
    if (website) {
      let domain = "";
      try {
        domain = new URL(website).hostname;
      } catch {
        domain = website.replace(/^https?:\/\//, "").split("/")[0];
      }

      await prisma.member_urls.create({
        data: {
          url: website,
          member_id: member.id,
          domain,
        },
      });
    }

    // Credit the referring domain: if this signup arrived via /go/<domain> (rref
    // cookie = the domain's referrer participant in the signup-referral campaign),
    // record the referred signup and issue the referrer a $5-token reward
    // (ledgered / unminted). One reward per referred signup; idempotent by email.
    try {
      const rrefRaw = req.cookies.get("rref")?.value || "";
      const rref = /^\d+$/.test(rrefRaw) ? parseInt(rrefRaw, 10) : NaN;
      if (Number.isFinite(rref)) {
        const CAMPAIGN = Number(process.env.REFERRALS_SIGNUP_CAMPAIGN || 77);
        const referrer = await prisma.campaign_participants.findFirst({
          where: { id: rref, campaign_id: CAMPAIGN },
        });
        const already = await prisma.campaign_participants.findFirst({
          where: { campaign_id: CAMPAIGN, email },
        });
        if (referrer && !already) {
          await prisma.campaign_participants.create({
            data: { campaign_id: CAMPAIGN, email, name, participant_id: member.id, invited_by: rref },
          });
          await prisma.participants_rewards.create({
            data: { campaign_id: CAMPAIGN, participant_id: rref, reward_type: 4, social_type: 1, token_symbol: "ADAO" },
          });
        }
      }
    } catch (refErr) {
      console.error("[register] referral credit failed (non-fatal):", refErr);
    }

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

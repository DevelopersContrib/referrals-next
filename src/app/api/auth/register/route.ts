import { NextRequest, NextResponse, after } from "next/server";
import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/ses";
import { postVnocAttribution } from "@/lib/vnoc-attribution";
import { enrollMemberInSignupReferral } from "@/lib/signup-referral";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, website, rref: rrefBody } = await req.json();

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
        plan_id: 1,
        // Trial clock starts on email verify — not at register — so days aren't burned waiting
        plan_expiry: null,
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

    // Credit the referring domain / member: rref cookie or body = referrer
    // participant id. Enroll this new member in the platform signup campaign
    // so they can invite others immediately, and reward the referrer once.
    let invite: Awaited<ReturnType<typeof enrollMemberInSignupReferral>> = null;
    try {
      const rrefRaw =
        (typeof rrefBody === "string" && rrefBody) ||
        req.cookies.get("rref")?.value ||
        "";
      const rref = /^\d+$/.test(rrefRaw) ? parseInt(rrefRaw, 10) : NaN;
      const invitedBy = Number.isFinite(rref) ? rref : null;

      invite = await enrollMemberInSignupReferral({
        memberId: member.id,
        email,
        name,
        invitedBy,
      });

      if (invitedBy && invite?.created) {
        const referrer = await prisma.campaign_participants.findFirst({
          where: { id: invitedBy },
        });
        if (referrer) {
          await prisma.participants_rewards.create({
            data: {
              campaign_id: referrer.campaign_id,
              participant_id: invitedBy,
              reward_type: 4,
              social_type: 1,
              token_symbol: "ADAO",
            },
          });
        }
      }
    } catch (refErr) {
      console.error("[register] referral credit failed (non-fatal):", refErr);
    }

    // Report the free signup to VNOC attribution (after the response; non-fatal).
    after(() =>
      postVnocAttribution({
        product: "referrals",
        eventType: "signup",
        refExternalId: String(member.id),
        payerEmail: email,
      })
    );

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
      shareUrl: invite?.shareUrl ?? null,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

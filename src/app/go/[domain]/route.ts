import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/domain-brand";
import { getOrCreateDomainReferrer } from "@/lib/domain-referrer";

/**
 * GET /go/<domain>
 *
 * Auto-attributing referral link. The domain in the URL is the REFERRER.
 * Place `https://referrals.com/go/<yourdomain>` anywhere — when a visitor
 * clicks it and signs up for referrals.com, <yourdomain> earns the referral
 * reward. We register the domain as a referrer in the referrals.com signup
 * program (campaign REFERRALS_SIGNUP_CAMPAIGN), drop an `rref` cookie, and
 * send the visitor to signup carrying the referrer.
 */
const REFERRALS_SIGNUP_CAMPAIGN = Number(process.env.REFERRALS_SIGNUP_CAMPAIGN || 77);

export async function GET(request: NextRequest, ctx: { params: Promise<{ domain: string }> }) {
  const root = (process.env.NEXT_PUBLIC_APP_URL || "https://www.referrals.com").replace(/\/$/, "");
  const { domain } = await ctx.params;
  const referrer = normalizeDomain(decodeURIComponent(domain || ""));

  const signup = new URL(`${root}/signup`);
  if (!referrer) return NextResponse.redirect(signup.toString(), 302);

  let participantId: number | null = null;
  try {
    const link = await getOrCreateDomainReferrer(referrer, REFERRALS_SIGNUP_CAMPAIGN);
    participantId = link.participantId;
  } catch {
    /* fall through — still send them to signup, just unattributed */
  }

  if (participantId) {
    signup.searchParams.set("rref", String(participantId));
    signup.searchParams.set("utm_source", "referral");
    signup.searchParams.set("utm_medium", "domain");
    signup.searchParams.set("utm_campaign", referrer);
  }

  const res = NextResponse.redirect(signup.toString(), 302);
  if (participantId) {
    // Persist so the signup conversion can attribute even after browsing.
    res.cookies.set("rref", String(participantId), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false, // signup form reads it client-side too
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

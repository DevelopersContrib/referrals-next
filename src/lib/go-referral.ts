import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDomain } from "@/lib/domain-brand";
import { getOrCreateDomainReferrer } from "@/lib/domain-referrer";
import { referralsSignupCampaignId } from "@/lib/signup-referral";

/**
 * Credit a referring domain and 302 to a safe destination (signup by default).
 * Used by GET /go/<domain> and the legacy GET /go?url=&ref=.
 */
export async function goReferralRedirect(
  referrerInput: string,
  destinationInput?: string | null
) {
  const root = (process.env.NEXT_PUBLIC_APP_URL || "https://www.referrals.com").replace(
    /\/$/,
    ""
  );
  const referrer = normalizeDomain(decodeURIComponent(referrerInput || ""));
  const dest = safeGoDestination(destinationInput, root);

  let participantId: number | null = null;
  if (referrer) {
    try {
      const brand = await prisma.member_urls.findFirst({
        where: {
          OR: [{ domain: referrer }, { domain: `www.${referrer}` }],
        },
        select: { referral_campaign_id: true },
        orderBy: { date_added: "desc" },
      });
      const campaignId = brand?.referral_campaign_id || referralsSignupCampaignId();
      const link = await getOrCreateDomainReferrer(referrer, campaignId);
      participantId = link.participantId;
    } catch {
      /* still send them onward, just unattributed */
    }
  }

  if (participantId) {
    dest.searchParams.set("rref", String(participantId));
    dest.searchParams.set("utm_source", "referral");
    dest.searchParams.set("utm_medium", "domain");
    dest.searchParams.set("utm_campaign", referrer);
  }

  const res = NextResponse.redirect(dest.toString(), 302);
  if (participantId) {
    res.cookies.set("rref", String(participantId), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

/** Only hop to referrals.com (and local) — never an open redirect. */
export function safeGoDestination(raw: string | null | undefined, fallbackOrigin: string): URL {
  const fallback = new URL(`${fallbackOrigin.replace(/\/$/, "")}/signup`);
  if (!raw?.trim()) return fallback;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const allowed =
      host === "referrals.com" ||
      host.endsWith(".referrals.com") ||
      host === "localhost" ||
      host === "127.0.0.1";
    return allowed ? url : fallback;
  } catch {
    return fallback;
  }
}

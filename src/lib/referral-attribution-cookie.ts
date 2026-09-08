import { NextResponse } from "next/server";

export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function isReferralsAppHost(hostname: string) {
  const host = normalizeHost(hostname);
  return (
    host === "referrals.com" ||
    host.endsWith(".referrals.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/** True when the hop stays on referrals.com (or local dev). */
export function isSameReferralsSite(destination: URL, appUrl: string) {
  try {
    const app = new URL(appUrl);
    const destHost = normalizeHost(destination.hostname);
    const appHost = normalizeHost(app.hostname);
    if (destHost === appHost) return true;
    return isReferralsAppHost(destHost) && isReferralsAppHost(appHost);
  } catch {
    return false;
  }
}

/**
 * 302 redirect with a 30-day attribution cookie.
 * Cross-site hops use SameSite=None; Secure (query ?ref= remains source of truth).
 */
export function redirectWithReferralCookie(
  destination: URL,
  participantId: number,
  appUrl: string,
  cookieName: "ref" | "rref" = "ref",
) {
  const res = NextResponse.redirect(destination.toString(), 302);
  const external = !isSameReferralsSite(destination, appUrl);
  res.cookies.set(cookieName, String(participantId), {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: external ? "none" : "lax",
    secure: external || destination.protocol === "https:",
    path: "/",
  });
  return res;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { brandForHost, isAppHost, normalizeHost, ROOT_DOMAIN } from "@/lib/brand-domains";

/** Paths a white-label host serves as-is (assets, tracking, widget, APIs). */
const BRAND_HOST_PASSTHROUGH = ["/_next", "/api/", "/t/", "/t2/", "/go/", "/widget"];

/**
 * A brand's own address (name.referrals.com or refer.theirsite.com) shows that
 * brand's public pages: "/" is the brand page, "/campaign/123" a campaign.
 * Anything else (dashboard, sign-in) belongs on referrals.com.
 */
async function brandHostResponse(request: NextRequest, host: string) {
  const { pathname, search } = request.nextUrl;
  const brand = await brandForHost(host);
  if (!brand) {
    return NextResponse.redirect(`https://www.${ROOT_DOMAIN}/`, 307);
  }
  if (pathname.includes(".") || BRAND_HOST_PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // Links to this brand's own /p/ pages still work; other brands' pages don't show here.
  const own = [`/p/${brand.slug}`, `/p/${brand.brandId}`];
  if (own.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (pathname === "/" || pathname === "/participants" || /^\/campaign\/\d+\/?$/.test(pathname)) {
    const url = request.nextUrl.clone();
    // By id, so a slug shared with an older brand can't pick the wrong one.
    url.pathname = `/p/${brand.brandId}${pathname === "/" ? "" : pathname.replace(/\/$/, "")}`;
    return NextResponse.rewrite(url, { headers: { "x-brand-host": host } });
  }
  return NextResponse.redirect(`https://www.${ROOT_DOMAIN}${pathname}${search}`, 307);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = normalizeHost(
    request.headers.get("host") ?? request.headers.get("x-forwarded-host")?.split(",")[0],
  );
  if (!isAppHost(host)) return brandHostResponse(request, host);

  // Public routes — always accessible
  const publicPrefixes = [
    "/api/auth",
    "/api/v1",
    "/v1/",
    "/api/widget",
    "/api/legacy",
    "/api/cron",
    "/api/domain-refer",
    "/api/brand",
    "/api/click",
    // Brand-analysis routes self-enforce auth (session / owner / internal secret).
    // The internal fan-out + cron sweeper reach /run without a session cookie.
    "/api/brands/analyze",
    "/api/billing/webhook",
    // Support inbound (Cloudflare Email Worker → Bearer secret; no session)
    "/api/webhooks/",
    // Public contact form → support ticket
    "/api/contacts",
    "/widget",
    "/blog/",
    "/lander",
    "/t/",
    "/t2/",
    "/go/",
    "/p/",
    "/public/",
    "/extension",
    "/developer",
    "/support/",
    "/topbar",
    "/invitepublic",
    "/sendinvite",
    "/coupon",
    "/brand/",
    "/campaign/",
    "/plans",
    "/_next",
    "/referral-program-for",
    "/campaign-templates",
  ];

  const publicExact = new Set([
    "/",
    "/go",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/about",
    "/how-it-works",
    "/pricing",
    "/privacy",
    "/terms",
    "/cookie-policy",
    "/contact",
    "/referral-program",
    "/walkthrough",
    "/signup/success",
    "/signup/share",
    "/widget.js",
    "/blog",
    "/support",
    "/knowledgebase",
    "/features",
    "/partners",
    "/affiliate",
    "/ambassador",
    "/whitelabel",
    "/feedback",
    "/campaign-templates",
    "/resources",
  ]);

  // Allow static files
  if (pathname.includes(".")) return NextResponse.next();

  // Allow public exact routes
  if (publicExact.has(pathname)) return NextResponse.next();

  // Forum reads are public. Composing and editing stay behind sign-in.
  const isForumWrite =
    pathname === "/forum/new" ||
    pathname.startsWith("/forum/new/") ||
    /^\/forum\/post\/[^/]+\/edit\/?$/.test(pathname);

  if (
    !isForumWrite &&
    (pathname === "/forum" || pathname.startsWith("/forum/"))
  ) {
    return NextResponse.next();
  }

  // Allow public prefix routes
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // App routes that require a session (see src/app/(dashboard) and src/app/(admin)).
  // Unknown paths must reach the App Router so Next can return a real 404 — not /signin.
  const authRequiredPagePrefixes = [
    "/admin",
    "/account",
    "/api-keys",
    "/billing",
    "/brands",
    "/contacts",
    "/dashboard",
    "/editor",
    "/forum/new",
    "/integrations",
    "/notifications",
    "/onboarding",
    "/promotions",
    "/stats",
    "/tools",
  ];

  const isAuthRequiredPage =
    isForumWrite ||
    authRequiredPagePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  // Check for auth session token cookie (next-auth sets this)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    // API clients expect JSON — never return the HTML /signin page (breaks Auth.js / fetch().json())
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAuthRequiredPage) {
      return NextResponse.next();
    }
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For admin routes, we can't check the JWT payload in edge without decryption,
  // so the admin check is done in the admin layout server component instead.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|widget.js|referral.js).*)"],
};

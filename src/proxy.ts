import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always accessible
  const publicPrefixes = [
    "/api/auth",
    "/api/v1",
    "/api/widget",
    "/api/legacy",
    "/api/cron",
    "/api/billing/webhook",
    "/widget",
    "/t/",
    "/t2/",
    "/p/",
    "/public/",
    "/extension",
    "/developer",
    "/topbar",
    "/invitepublic",
    "/sendinvite",
    "/coupon",
    "/brand/",
    "/campaign/",
    "/plans",
    "/_next",
  ];

  const publicExact = new Set([
    "/",
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
    "/contribute",
    "/walkthrough",
    "/signup/success",
    "/signup/share",
    "/widget.js",
    "/blog",
    "/support",
    "/knowledgebase",
    "/features",
    "/community",
    "/partners",
    "/affiliate",
    "/ambassador",
    "/whitelabel",
    "/services",
    "/feedback",
    "/campaign-templates",
    "/send-to-friends",
  ]);

  // Allow static files
  if (pathname.includes(".")) return NextResponse.next();

  // Allow public exact routes
  if (publicExact.has(pathname)) return NextResponse.next();

  // Allow public prefix routes
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check for auth session token cookie (next-auth sets this)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For admin routes, we can't check the JWT payload in edge without decryption,
  // so the admin check is done in the admin layout server component instead.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|widget.js).*)"],
};

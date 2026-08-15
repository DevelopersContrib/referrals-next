import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePaidSubscription } from "@/lib/billing-activation";

/**
 * PayPal subscription return handler (redirect checkout).
 *
 * The member is taken from the session — never from the query string — so a
 * request cannot grant a plan to an arbitrary account. All validation and
 * persistence lives in activatePaidSubscription, shared with the in-page
 * (PayPal / card buttons) checkout.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subscriptionId = searchParams.get("subscription_id");
  const planId = searchParams.get("planId");
  const brandId = searchParams.get("brandId");
  const attemptId = searchParams.get("attemptId");

  const session = await auth();
  if (!session?.user?.id) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(signIn);
  }

  if (!subscriptionId || !planId) {
    return NextResponse.redirect(
      new URL("/billing?error=missing_params", req.url),
    );
  }

  const result = await activatePaidSubscription({
    memberId: parseInt(session.user.id, 10),
    planId: parseInt(planId, 10),
    brandId: brandId ? parseInt(brandId, 10) : null,
    subscriptionId,
    attemptId,
  });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/billing?error=${result.error}`, req.url),
    );
  }

  return NextResponse.redirect(new URL("/billing/success", req.url));
}

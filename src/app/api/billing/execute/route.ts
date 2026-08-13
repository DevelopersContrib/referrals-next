import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";
import { postVnocAttribution, resolveVnocPlan } from "@/lib/vnoc-attribution";

/**
 * PayPal subscription return handler.
 *
 * Security: this must only ever apply a subscription to the *authenticated*
 * user who completed checkout. The member is taken from the session — never
 * from the query string — so a request cannot grant a plan to an arbitrary
 * account. We also verify the PayPal subscription is active, bind its PayPal
 * plan to the requested plan when a mapping is known, and guard against replay
 * (re-hitting the URL must not stack payments / extend expiry).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subscriptionId = searchParams.get("subscription_id");
  const planId = searchParams.get("planId");
  const brandId = searchParams.get("brandId");

  // Require an authenticated session; the member is derived from it.
  const session = await auth();
  if (!session?.user?.id) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(signIn);
  }
  const memberId = parseInt(session.user.id, 10);

  if (!subscriptionId || !planId) {
    return NextResponse.redirect(
      new URL("/billing?error=missing_params", req.url),
    );
  }

  try {
    const plan = await prisma.plans.findUnique({
      where: { id: parseInt(planId, 10) },
    });

    if (!plan) {
      return NextResponse.redirect(
        new URL("/billing?error=plan_not_found", req.url),
      );
    }

    // Replay guard: if this subscription was already processed, don't
    // re-apply it (prevents stacking payments and extending expiry).
    const alreadyProcessed = await prisma.member_payment.findFirst({
      where: { transaction_id: subscriptionId },
    });
    if (alreadyProcessed) {
      return NextResponse.redirect(new URL("/billing/success", req.url));
    }

    const subscription = await getSubscription(subscriptionId);
    const paypalPlanId = subscription.plan_id as string | undefined;
    const status = (subscription.status as string | undefined)?.toUpperCase();

    if (!paypalPlanId) {
      console.error("PayPal subscription missing plan_id:", subscription);
      return NextResponse.redirect(
        new URL("/billing?error=paypal_plan_not_found", req.url),
      );
    }

    // Only honor subscriptions PayPal considers live.
    if (status && !["ACTIVE", "APPROVED"].includes(status)) {
      return NextResponse.redirect(
        new URL("/billing?error=subscription_not_active", req.url),
      );
    }

    // If we've seen this PayPal plan before, it must map to the plan being
    // claimed — blocks paying for a cheap plan and claiming an expensive one.
    const knownMapping = await prisma.member_plan.findFirst({
      where: { paypal_plan_id: paypalPlanId },
      orderBy: { id: "desc" },
    });
    if (knownMapping && knownMapping.payment_id !== plan.id) {
      console.error(
        `[billing/execute] plan mismatch: paypal plan ${paypalPlanId} maps to ${knownMapping.payment_id}, claimed ${plan.id}`,
      );
      return NextResponse.redirect(
        new URL("/billing?error=plan_mismatch", req.url),
      );
    }

    const parsedBrandId = brandId ? parseInt(brandId, 10) : null;

    if (parsedBrandId) {
      const brand = await prisma.member_urls.findFirst({
        where: { id: parsedBrandId, member_id: memberId },
      });
      if (!brand) {
        return NextResponse.redirect(
          new URL("/billing?error=brand_not_found", req.url),
        );
      }
    }

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (plan.days || 30));

    // Save subscription
    await prisma.member_plan.create({
      data: {
        member_id: memberId,
        paypal_plan_id: paypalPlanId,
        paypal_agreement_id: subscriptionId,
        payment_id: plan.id,
        date_added: now,
      },
    });

    if (parsedBrandId) {
      await prisma.url_plan.create({
        data: {
          url_id: parsedBrandId,
          member_id: memberId,
          paypal_plan_id: paypalPlanId,
          paypal_agreement_id: subscriptionId,
          payment_id: plan.id,
          date_added: now,
        },
      });
    }

    // Record payment
    await prisma.member_payment.create({
      data: {
        member_id: memberId,
        amount: plan.price,
        datetime_created: now,
        status: "completed",
        transaction_id: subscriptionId,
        currency: "USD",
        plan_expiry: expiry,
      },
    });

    // Update member
    await prisma.members.update({
      where: { id: memberId },
      data: {
        plan_id: parseInt(planId, 10),
        plan_expiry: expiry,
      },
    });

    // Report the paid subscription to VNOC (after response; idempotent by
    // subscription id, which matches the replay guard above so the PayPal
    // webhook duplicate won't double-count).
    const priceUsd = plan.price ?? 0;
    const billing = (plan.days || 30) >= 365 ? "year" : "month";
    const mapped = resolveVnocPlan(priceUsd, billing);
    after(() =>
      postVnocAttribution({
        product: mapped?.product ?? "referrals",
        eventType: "paid",
        eventValueUsd: priceUsd,
        refExternalId: subscriptionId,
        planSlug: mapped?.planSlug,
        paymentMethod: "paypal",
      })
    );

    return NextResponse.redirect(new URL("/billing/success", req.url));
  } catch (error) {
    console.error("Execute subscription error:", error);
    return NextResponse.redirect(
      new URL("/billing?error=execution_failed", req.url),
    );
  }
}

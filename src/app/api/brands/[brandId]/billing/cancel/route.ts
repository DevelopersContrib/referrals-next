import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelSubscription, getSubscription } from "@/lib/paypal";
import { postVnocAttribution, resolveVnocPlan } from "@/lib/vnoc-attribution";

type Ctx = { params: Promise<{ brandId: string }> };

/**
 * Cancel one brand's own $9/mo or $99/yr subscription (url_plan.paypal_agreement_id).
 * The brand keeps its paid time: member_urls.plan_expiry is left as is, so it
 * stays live until then and simply isn't renewed.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const memberId = parseInt(session.user.id, 10);
  const brandId = parseInt((await ctx.params).brandId, 10);
  if (Number.isNaN(brandId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { member_id: true, plan_expiry: true },
  });
  if (!brand || brand.member_id !== memberId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const urlPlan = await prisma.url_plan.findFirst({
    where: { url_id: brandId },
    orderBy: { id: "desc" },
    select: { paypal_agreement_id: true, agreement_cancel: true, payment_id: true },
  });
  const agreementId = urlPlan?.paypal_agreement_id;
  if (!agreementId) {
    return NextResponse.json({ error: "This brand has no subscription to cancel." }, { status: 404 });
  }

  // Agency checkouts are stamped on the brand they started from, but they pay
  // for the whole account. Those are cancelled on the main Billing page.
  const plan = urlPlan.payment_id
    ? await prisma.plans.findUnique({
        where: { id: urlPlan.payment_id },
        select: { price: true, no_of_domains: true },
      })
    : null;
  if (plan && (plan.no_of_domains ?? 1) !== 1) {
    return NextResponse.json(
      { error: "This brand is paid through your agency plan. Manage it on the Billing page." },
      { status: 400 },
    );
  }

  if (urlPlan.agreement_cancel) {
    return NextResponse.json({ success: true, alreadyCancelled: true, liveUntil: brand.plan_expiry });
  }

  const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 120)
      : "Customer cancelled brand plan";

  // cancelSubscription returns PayPal's error body instead of throwing. If the
  // call didn't succeed, it still counts when PayPal already shows it cancelled
  // (for example, cancelled from the PayPal account).
  const result = (await cancelSubscription(agreementId, reason).catch(() => null)) as
    | { success?: boolean }
    | null;
  if (result?.success !== true) {
    const live = (await getSubscription(agreementId).catch(() => null)) as { status?: string } | null;
    const status = String(live?.status ?? "").toUpperCase();
    if (status !== "CANCELLED" && status !== "EXPIRED") {
      return NextResponse.json(
        { error: "PayPal couldn't cancel this subscription. Please try again." },
        { status: 502 },
      );
    }
  }

  const at = new Date().toISOString();
  await prisma.$transaction([
    prisma.url_plan.updateMany({
      where: { url_id: brandId, paypal_agreement_id: agreementId, agreement_cancel: null },
      data: { agreement_cancel: at },
    }),
    prisma.member_plan.updateMany({
      where: { member_id: memberId, paypal_agreement_id: agreementId, agreement_cancel: null },
      data: { agreement_cancel: at },
    }),
  ]);

  // Report the cancellation to VNOC (after response; non-fatal).
  const mapped = plan ? resolveVnocPlan(plan.price ?? 0) : null;
  after(() =>
    postVnocAttribution({
      product: mapped?.product ?? "referrals",
      eventType: "cancel",
      refExternalId: agreementId,
      planSlug: mapped?.planSlug,
    }),
  );

  return NextResponse.json({ success: true, liveUntil: brand.plan_expiry });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePaidSubscription } from "@/lib/billing-activation";

const FAILURE_MESSAGES: Record<string, string> = {
  missing_params: "Missing subscription details.",
  plan_not_found: "Plan not found.",
  paypal_plan_not_found: "PayPal did not return a billing plan for this subscription.",
  subscription_not_active: "PayPal has not activated this subscription yet.",
  plan_mismatch: "This PayPal subscription belongs to a different plan.",
  brand_not_found: "Brand not found.",
  execution_failed: "We could not activate your subscription.",
};

/**
 * POST /api/billing/confirm
 * Body: { subscriptionId, planId, brandId? }
 *
 * Called by the in-page PayPal / card buttons after approval. Same guarantees
 * as the redirect return URL: session-derived member, PayPal-verified status,
 * replay-safe.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    subscriptionId?: string;
    planId?: number;
    brandId?: number;
    attemptId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const subscriptionId = String(body.subscriptionId || "").trim();
  const planId = Number(body.planId);

  if (!subscriptionId || !Number.isFinite(planId)) {
    return NextResponse.json(
      { error: "subscriptionId and planId are required" },
      { status: 400 }
    );
  }

  const result = await activatePaidSubscription({
    memberId: parseInt(session.user.id, 10),
    planId,
    brandId: Number.isFinite(Number(body.brandId)) ? Number(body.brandId) : null,
    subscriptionId,
    attemptId: body.attemptId,
  });

  if (!result.ok) {
    const status =
      result.error === "execution_failed" || result.error === "paypal_plan_not_found"
        ? 502
        : 400;
    return NextResponse.json(
      { error: FAILURE_MESSAGES[result.error] || "Activation failed", code: result.error },
      { status }
    );
  }

  return NextResponse.json({ success: true, redirectUrl: "/billing/success" });
}

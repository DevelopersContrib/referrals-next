import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function subscriptionRequiredResponse() {
  return NextResponse.json(
    {
      error:
        "An active subscription is required to publish referral programs or add extra brands. Open Billing to choose a plan.",
      code: "REQUIRES_SUBSCRIPTION",
    },
    { status: 403 }
  );
}

/** Local/dev bypass — set SKIP_PAID_SUBSCRIPTION_GATE=true in .env to treat all members as paid for gates. */
export function skipPaidSubscriptionGate() {
  return process.env.SKIP_PAID_SUBSCRIPTION_GATE === "true";
}

/**
 * Paid = member has a plan with price > 0, non-expired plan_expiry, and verified email.
 * Free / trial rows with price 0 do not count as paid.
 */
export async function isMemberOnPaidPlan(memberId: number): Promise<boolean> {
  if (skipPaidSubscriptionGate()) return true;

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: {
      plan_id: true,
      plan_expiry: true,
      is_verified: true,
    },
  });
  if (!member?.is_verified) return false;
  if (!member.plan_id || member.plan_id <= 0) return false;
  if (!member.plan_expiry) return false;
  if (new Date(member.plan_expiry) < new Date()) return false;

  const plan = await prisma.plans.findUnique({
    where: { id: member.plan_id },
    select: { price: true },
  });
  if (!plan || (plan.price ?? 0) <= 0) return false;
  return true;
}

export async function countMemberBrands(memberId: number) {
  return prisma.member_urls.count({ where: { member_id: memberId } });
}

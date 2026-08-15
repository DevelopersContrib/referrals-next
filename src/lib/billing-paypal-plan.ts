import { prisma } from "@/lib/prisma";
import {
  createSubscriptionPlan,
  findSubscriptionPlanIdByName,
  getOrCreateProduct,
} from "@/lib/paypal";

export type BillablePlan = {
  id: number;
  name: string | null;
  price: number | null;
  unit: string | null;
};

export function paypalBillingInterval(plan: BillablePlan): "MONTH" | "YEAR" {
  return plan.unit?.toUpperCase() === "YEAR" ? "YEAR" : "MONTH";
}

/**
 * Deterministic PayPal plan name. Encoding our plan id + price makes the plan
 * findable on PayPal, which is what keeps repeat checkouts from creating a new
 * billing plan every time.
 */
export function paypalPlanNameFor(plan: BillablePlan): string {
  const price = Number(plan.price ?? 0).toFixed(2);
  const interval = paypalBillingInterval(plan);
  return `Referrals.com #${plan.id} ${plan.name || "Plan"} $${price}/${interval}`.slice(
    0,
    127
  );
}

/**
 * PayPal plan id for one of our plans: previously used mapping, then an
 * existing PayPal plan of the same name, then create one.
 */
export async function resolvePaypalPlanId(plan: BillablePlan): Promise<string | null> {
  const mapped = await prisma.member_plan.findFirst({
    where: { paypal_plan_id: { not: "" }, payment_id: plan.id },
    orderBy: { id: "desc" },
    select: { paypal_plan_id: true },
  });
  if (mapped?.paypal_plan_id) return mapped.paypal_plan_id;

  const name = paypalPlanNameFor(plan);

  try {
    const productId = await getOrCreateProduct();
    const existing = await findSubscriptionPlanIdByName(name, productId);
    if (existing) return existing;
  } catch (error) {
    console.error("[billing] PayPal plan lookup failed:", error);
  }

  const created = await createSubscriptionPlan(
    name,
    String(plan.price ?? "0"),
    paypalBillingInterval(plan)
  );

  if (!created?.id) {
    console.error("[billing] PayPal plan creation failed:", created);
    return null;
  }

  return created.id as string;
}

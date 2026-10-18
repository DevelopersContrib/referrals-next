/** Shared plan catalog helpers — billing + public pricing must import from here. */

import {
  AGENCY_10_PLAN_ID,
  AGENCY_50_PLAN_ID,
  PLAN_PUBLIC_NAME,
  PUBLIC_SALE_PLAN_IDS,
} from "@/lib/billing-constants";

export type CatalogPlan = {
  id: number;
  name: string | null;
  price: number | null;
  unit: string | null;
  days: number | null;
  no_of_domains: number | null;
  campaigns_participants: number | null;
};

export const PLAN_CATALOG_COPY = {
  freeIsVnocOnly: true,
  vnocFootnote: "Network domains stay free. Everyone else publishes a brand at $9/mo or $99/yr.",
  trialFootnote: "Set up a brand for free. Pay $9/mo (or $99/yr) to publish it.",
  unpaidFootnote:
    "A brand stays private until you pay. Agency plans cover 10 or 50 brands on one subscription.",
} as const;

export function publicPlanName(plan: CatalogPlan): string {
  return PLAN_PUBLIC_NAME[plan.id] ?? plan.name ?? `Plan ${plan.id}`;
}

export function isPublicSalePlan(plan: CatalogPlan): boolean {
  return (PUBLIC_SALE_PLAN_IDS as readonly number[]).includes(plan.id);
}

export function saleCatalogPlans<T extends CatalogPlan>(plans: T[]): T[] {
  return plans.filter((plan) => isPublicSalePlan(plan) && isPaidCatalogPlan(plan));
}

export function isPaidCatalogPlan(plan: CatalogPlan): boolean {
  return (plan.price ?? 0) > 0;
}

export function paidCatalogPlans<T extends CatalogPlan>(plans: T[]): T[] {
  return saleCatalogPlans(plans);
}

export function isPartnerPlan(plan: CatalogPlan | string | null | undefined): boolean {
  if (plan && typeof plan === "object") {
    return plan.id === AGENCY_10_PLAN_ID || plan.id === AGENCY_50_PLAN_ID;
  }
  return /partner/i.test(plan ?? "");
}

export function splitPlanAudiences<T extends CatalogPlan>(plans: T[]) {
  const individuals: T[] = [];
  const partners: T[] = [];
  for (const plan of plans) {
    if (isPartnerPlan(plan)) partners.push(plan);
    else individuals.push(plan);
  }
  return { individuals, partners };
}

export function isAnnual(plan: CatalogPlan): boolean {
  const unit = (plan.unit ?? "").toLowerCase();
  return unit.includes("year") || (plan.days ?? 0) >= 365;
}

export function monthlyEquivalent(plan: CatalogPlan): number | null {
  const price = plan.price ?? 0;
  if (price <= 0) return null;
  if (isAnnual(plan)) return price / 12;
  return price;
}

export function isMostPopularIndividual(
  plan: CatalogPlan,
  plans: CatalogPlan[],
): boolean {
  const paidIndividuals = plans.filter(
    (p) => !isPartnerPlan(p) && (p.price ?? 0) > 0,
  );
  if (paidIndividuals.length === 0) return false;
  const cheapest = [...paidIndividuals].sort(
    (a, b) => (a.price ?? 0) - (b.price ?? 0),
  )[0];
  return plan.id === cheapest.id;
}

/** "Unlimited brands" / "Up to 3 brands" — how many brands a plan covers. */
export function planBrandScope(plan: CatalogPlan): string {
  const domains = plan.no_of_domains;
  if (domains == null || domains <= 0) return "Unlimited brands";
  return `Up to ${domains} brand${domains === 1 ? "" : "s"}`;
}

/**
 * What the plan includes. Billing cadence is deliberately absent — it is a
 * payment option, not a feature, and `planBillingLabel` already renders it
 * next to the price on every card.
 */
export function getPlanFeatures(plan: CatalogPlan): string[] {
  const features: string[] = [planBrandScope(plan)];

  const participants = plan.campaigns_participants;
  if (participants == null || participants <= 0) {
    features.push("Unlimited participants per campaign");
  } else {
    features.push(`${participants} participants per campaign`);
  }

  const price = plan.price ?? 0;
  if (price <= 0) {
    features.push("Referral widget with Referrals.com branding");
    return features;
  }

  features.push("Gamification & leaderboards");
  features.push("Remove Referrals.com branding");
  features.push("Advanced analytics");
  features.push("Widget templates & embeds");
  if (isPartnerPlan(plan)) {
    features.push("Publish up to this many brands on one subscription");
  }

  return features;
}

export function formatPlanPrice(plan: CatalogPlan): string {
  return `$${(plan.price ?? 0).toFixed(2)}`;
}

/** Price without trailing ".00", for space-constrained UI like the hero mockup. */
export function formatPlanPriceShort(plan: CatalogPlan): string {
  const price = plan.price ?? 0;
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

export function planBillingLabel(plan: CatalogPlan): string {
  if (isAnnual(plan)) {
    const monthly = monthlyEquivalent(plan);
    return monthly
      ? `Billed annually · ~$${monthly.toFixed(0)}/mo`
      : "Billed annually";
  }
  return "Billed monthly";
}

/** Shared plan catalog helpers — billing + public pricing must import from here. */

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
  vnocFootnote: "VNOC / network domains stay free.",
  trialFootnote:
    "14-day Growth trial for external brands — then $9/mo per brand.",
  unpaidFootnote:
    "After trial, external brands need Growth ($9/mo per brand). Widget stays live for visitors with branding on.",
} as const;

export function isPartnerPlan(name: string | null | undefined): boolean {
  return /partner/i.test(name ?? "");
}

export function splitPlanAudiences<T extends CatalogPlan>(plans: T[]) {
  const individuals: T[] = [];
  const partners: T[] = [];
  for (const plan of plans) {
    if (isPartnerPlan(plan.name)) partners.push(plan);
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
    (p) => !isPartnerPlan(p.name) && (p.price ?? 0) > 0,
  );
  if (paidIndividuals.length === 0) return false;
  const cheapest = [...paidIndividuals].sort(
    (a, b) => (a.price ?? 0) - (b.price ?? 0),
  )[0];
  return plan.id === cheapest.id;
}

export function getPlanFeatures(plan: CatalogPlan): string[] {
  const features: string[] = [];
  const domains = plan.no_of_domains;
  if (domains == null || domains <= 0) {
    features.push("Unlimited brands");
  } else {
    features.push(`Up to ${domains} brand${domains === 1 ? "" : "s"}`);
  }

  const participants = plan.campaigns_participants;
  if (participants == null || participants <= 0) {
    features.push("Unlimited participants per campaign");
  } else {
    features.push(`${participants} participants per campaign`);
  }

  const price = plan.price ?? 0;
  if (price <= 0) {
    features.push(PLAN_CATALOG_COPY.vnocFootnote);
    return features;
  }

  if (isAnnual(plan)) {
    const monthly = monthlyEquivalent(plan);
    features.push(
      monthly
        ? `Billed annually (~$${monthly.toFixed(0)}/mo)`
        : "Billed annually",
    );
  } else {
    features.push("Billed monthly");
  }

  features.push("Gamification & leaderboards");
  features.push("Remove Referrals.com branding");
  features.push("Advanced analytics");
  features.push("Widget templates & embeds");
  if (isPartnerPlan(plan.name)) {
    features.push("Multi-brand plans for agencies and resellers");
  }

  return features;
}

export function formatPlanPrice(plan: CatalogPlan): string {
  return `$${(plan.price ?? 0).toFixed(2)}`;
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

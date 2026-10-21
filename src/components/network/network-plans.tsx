import {
  formatPlanPriceShort,
  getPlanFeatures,
  planBillingLabel,
  planBrandScope,
  publicPlanName,
  saleCatalogPlans,
  splitPlanAudiences,
  type CatalogPlan,
} from "@/lib/plan-catalog";
import { networkSignupHref, type NetworkSite } from "@/lib/network-sites";

/**
 * The same plans referrals.com sells (from the plans table), as a price list:
 * every plan has every feature, so plans differ only by brands and billing.
 */
export function NetworkPlans({ site, plans }: { site: NetworkSite; plans: CatalogPlan[] }) {
  const sale = saleCatalogPlans(plans);
  const { individuals, partners } = splitPlanAudiences(sale);
  const scope = sale[0] ? planBrandScope(sale[0]) : null;
  const included = sale[0] ? getPlanFeatures(sale[0]).filter((f) => f !== scope) : [];

  return (
    <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-12">
        {[
          { title: "For one brand", items: individuals },
          { title: "For agencies and partners", items: partners },
        ]
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.title}>
              <h2 className="text-xl font-bold">{group.title}</h2>
              <ul className="mt-4 border-t-2 border-[var(--net-ink)]">
                {group.items.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--net-ink)]/15 py-5"
                  >
                    <div className="min-w-[10rem] flex-1">
                      <p className="font-semibold">{publicPlanName(plan)}</p>
                      <p className="text-sm text-[var(--net-ink)]/60">
                        {planBrandScope(plan)}. {planBillingLabel(plan)}.
                      </p>
                    </div>
                    <p className="text-3xl font-bold tabular-nums tracking-[-0.02em]">
                      {formatPlanPriceShort(plan)}
                    </p>
                    <a
                      href={networkSignupHref(site)}
                      className="rounded-[var(--net-radius)] bg-[var(--net-primary)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Start free
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>

      <aside className="self-start rounded-[var(--net-radius)] bg-[var(--net-tint)] p-7">
        <h2 className="text-lg font-bold">Every plan includes</h2>
        <ul className="mt-4 space-y-3">
          {included.map((f) => (
            <li key={f} className="flex gap-3">
              <span aria-hidden className="font-bold text-[var(--net-primary)]">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-[var(--net-ink)]/65">
          Set up free. You pay when you publish a brand. Billing is handled on Referrals.com, the
          platform behind {site.name}.
        </p>
      </aside>
    </div>
  );
}

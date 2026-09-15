import Link from "next/link";
import {
  formatPlanPrice,
  getPlanFeatures,
  isMostPopularIndividual,
  PLAN_CATALOG_COPY,
  planBillingLabel,
  splitPlanAudiences,
  type CatalogPlan,
} from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

type PublicPlanCatalogProps = {
  plans: CatalogPlan[];
  isLoggedIn: boolean;
  /** Homepage uses a tighter layout and shorter feature lists. */
  variant?: "full" | "compact";
};

function planCtaHref(planId: number, isPaid: boolean, isLoggedIn: boolean) {
  if (!isPaid) return "/signup";
  if (isLoggedIn) return `/billing/plan/${planId}`;
  return "/signup";
}

function planCtaLabel(
  planName: string | null,
  isPaid: boolean,
  isLoggedIn: boolean,
) {
  if (!isPaid) return "Start free trial";
  if (isLoggedIn) return `Get ${planName ?? "plan"}`;
  return "Start free trial";
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      className="mt-0.5 size-5 shrink-0"
      style={{ color }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PublicPlanCard({
  plan,
  plans,
  isLoggedIn,
  variant,
}: {
  plan: CatalogPlan;
  plans: CatalogPlan[];
  isLoggedIn: boolean;
  variant: "full" | "compact";
}) {
  const price = plan.price ?? 0;
  const isPaidPlan = price > 0;
  const isPopular = isMostPopularIndividual(plan, plans);
  const accent = isPaidPlan ? "#926efb" : "#FF5C62";
  const features = getPlanFeatures(plan);
  const shownFeatures =
    variant === "compact" ? features.slice(0, isPaidPlan ? 4 : 3) : features;
  const href = planCtaHref(plan.id, isPaidPlan, isLoggedIn);
  const ctaLabel = planCtaLabel(plan.name, isPaidPlan, isLoggedIn);

  return (
    <article
      className={cn(
        "group relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6",
        isPopular &&
          "border-2 border-[#926efb] shadow-lg shadow-violet-200/50 ring-2 ring-[#926efb]/20",
        !isPopular && isPaidPlan && "border-violet-200/80",
        !isPopular && !isPaidPlan && "border-rose-100/90",
      )}
    >
      {isPopular && (
        <div className="mb-3 flex justify-center">
          <span className="rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-3.5 py-1 text-xs font-bold tracking-wide text-white shadow-md shadow-violet-300/40">
            Most Popular
          </span>
        </div>
      )}

      {isPaidPlan && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
      )}

      <div
        className={cn(
          "mb-5 rounded-xl p-4",
          isPaidPlan
            ? "bg-gradient-to-br from-violet-500/10 to-rose-50/20"
            : "bg-gradient-to-br from-rose-500/10 to-orange-50/30",
        )}
      >
        <h3 className="min-w-0 break-words text-lg font-bold tracking-tight text-gray-900">
          {plan.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {formatPlanPrice(plan)}
          </span>
          <span className="text-sm text-gray-500">/{plan.unit || "month"}</span>
        </div>
        {isPaidPlan ? (
          <p className="mt-2 text-xs text-gray-500">{planBillingLabel(plan)}</p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {PLAN_CATALOG_COPY.trialFootnote}
          </p>
        )}
      </div>

      <ul className="flex-1 space-y-3">
        {shownFeatures.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-gray-700"
          >
            <CheckIcon color={accent} />
            {feature}
          </li>
        ))}
      </ul>

      {isPaidPlan ? (
        <Link
          href={href}
          className={cn(
            "mt-6 flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
            isPopular
              ? "bg-gradient-to-r from-[#926efb] to-[#7c3aed] shadow-violet-300/40 hover:brightness-105 focus-visible:outline-[#926efb]"
              : "bg-[#926efb] hover:bg-[#7c5ce0] focus-visible:outline-[#926efb]",
          )}
        >
          {ctaLabel}
        </Link>
      ) : (
        <div className="mt-6 space-y-2">
          <Link
            href="/signup"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#FF5C62]/30 bg-[#FF5C62]/5 px-4 py-3 text-center text-sm font-semibold text-[#FF5C62] transition hover:bg-[#FF5C62]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C62]"
          >
            Start free trial
          </Link>
          <p className="text-center text-[11px] leading-snug text-gray-500">
            {PLAN_CATALOG_COPY.vnocFootnote}
          </p>
        </div>
      )}
    </article>
  );
}

/**
 * Shared Individuals / Partners catalog for /pricing and homepage.
 * Same helpers as /billing — visitors signup; members go to checkout.
 */
export function PublicPlanCatalog({
  plans,
  isLoggedIn,
  variant = "full",
}: PublicPlanCatalogProps) {
  const { individuals, partners } = splitPlanAudiences(plans);

  return (
    <div className="w-full min-w-0 space-y-10">
      <section aria-labelledby="plans-individuals">
        <div className="mb-5">
          <h2
            id="plans-individuals"
            className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl"
          >
            For Individuals
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-gray-600 sm:text-base">
            {PLAN_CATALOG_COPY.trialFootnote}
          </p>
        </div>
        <div
          className={cn(
            "grid grid-cols-1 gap-5",
            variant === "compact"
              ? "lg:grid-cols-2 xl:grid-cols-3"
              : "lg:grid-cols-2 lg:gap-6 xl:grid-cols-3",
          )}
        >
          {individuals.map((plan) => (
            <PublicPlanCard
              key={plan.id}
              plan={plan}
              plans={plans}
              isLoggedIn={isLoggedIn}
              variant={variant}
            />
          ))}
        </div>
      </section>

      {partners.length > 0 && (
        <section aria-labelledby="plans-partners">
          <div className="mb-5">
            <h2
              id="plans-partners"
              className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl"
            >
              For Partners &amp; Agencies
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-gray-600 sm:text-base">
              Multi-brand plans for agencies and resellers.
            </p>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 gap-5",
              variant === "compact"
                ? "lg:grid-cols-2 xl:grid-cols-3"
                : "lg:grid-cols-2 lg:gap-6 xl:grid-cols-3",
            )}
          >
            {partners.map((plan) => (
              <PublicPlanCard
                key={plan.id}
                plan={plan}
                plans={plans}
                isLoggedIn={isLoggedIn}
                variant={variant}
              />
            ))}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-gray-500 sm:text-left">
        {PLAN_CATALOG_COPY.vnocFootnote} {PLAN_CATALOG_COPY.unpaidFootnote}
      </p>
    </div>
  );
}

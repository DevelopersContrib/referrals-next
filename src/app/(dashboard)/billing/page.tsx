import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BillingErrorBanner } from "@/components/billing/billing-error-banner";
import { BillingSubscriptionActions } from "@/components/billing/billing-subscription-actions";
import { getMemberEntitlement } from "@/lib/member-subscription";
import {
  getPlanFeatures,
  isMostPopularIndividual,
  PLAN_CATALOG_COPY,
  planBillingLabel,
  splitPlanAudiences,
  formatPlanPrice,
  type CatalogPlan,
} from "@/lib/plan-catalog";
import { cn } from "@/lib/utils";

type HumanBillingStatus = "trial" | "free" | "unpaid" | "paid" | "cancelled";

function resolveHumanStatus(
  entitlementStatus: string,
  isCancelled: boolean,
): HumanBillingStatus {
  if (isCancelled) return "cancelled";
  if (entitlementStatus === "trial") return "trial";
  if (entitlementStatus === "paid") return "paid";
  if (entitlementStatus === "unpaid") return "unpaid";
  return "free";
}

function statusBadgeVariant(
  status: HumanBillingStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "trial":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: HumanBillingStatus): string {
  switch (status) {
    case "trial":
      return "Trial";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    case "unpaid":
      return "Unpaid";
    default:
      return "Free";
  }
}

function statusDetail(
  status: HumanBillingStatus,
  planExpiry: Date | null,
  daysLeft: number | null,
): string | null {
  if (status === "unpaid") {
    return "Trial ended — pay $9/mo per brand to keep Growth";
  }

  if (status === "free") {
    return PLAN_CATALOG_COPY.vnocFootnote;
  }

  if (!planExpiry) return null;

  const dateLabel = planExpiry.toLocaleDateString();

  if (status === "trial") {
    if (daysLeft != null && daysLeft > 0) {
      return `Trial ends ${dateLabel} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
    }
    return `Trial ends ${dateLabel}`;
  }

  if (status === "cancelled") {
    const stillActive = planExpiry.getTime() > Date.now();
    return stillActive ? `Access until ${dateLabel}` : `Ended ${dateLabel}`;
  }

  if (status === "paid") {
    return `Renews ${dateLabel}`;
  }

  return null;
}

function PlanCard({
  plan,
  plans,
  activePlanId,
}: {
  plan: CatalogPlan;
  plans: CatalogPlan[];
  activePlanId: number;
}) {
  const price = plan.price || 0;
  const isPaidPlan = price > 0;
  const isCurrent = activePlanId === plan.id;
  const isPopular = isMostPopularIndividual(plan, plans);
  const accent = isPaidPlan ? "#926efb" : "#FF5C62";
  const features = getPlanFeatures(plan);

  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-md sm:p-6",
        isPopular &&
          "border-2 border-[#926efb] shadow-lg shadow-violet-200/50 ring-2 ring-[#926efb]/20",
        isCurrent &&
          isPaidPlan &&
          !isPopular &&
          "border-2 border-[#926efb] ring-2 ring-[#926efb]/20",
        isCurrent &&
          !isPaidPlan &&
          "border-2 border-[#FF5C62]/70 shadow-rose-100",
        !isCurrent && isPaidPlan && !isPopular && "border-violet-200/80",
        !isCurrent && !isPaidPlan && "border-rose-100/90",
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-3 py-1 text-xs font-bold text-white shadow-md">
          Most Popular
        </span>
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
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 break-words text-lg font-bold tracking-tight text-gray-900">
            {plan.name}
          </h3>
          {isCurrent && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white",
                isPaidPlan ? "bg-[#926efb]" : "bg-[#FF5C62]",
              )}
            >
              Current
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {formatPlanPrice(plan)}
          </span>
          <span className="text-sm text-gray-500">/{plan.unit || "month"}</span>
        </div>
        {isPaidPlan && (
          <p className="mt-2 text-xs text-gray-500">{planBillingLabel(plan)}</p>
        )}
      </div>

      <ul className="flex-1 space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-gray-700"
          >
            <CheckIcon color={accent} />
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <span
          className={cn(
            "mt-6 flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-semibold",
            isPaidPlan
              ? "border-violet-200 bg-violet-50 text-[#7c3aed]"
              : "border-rose-100 bg-rose-50/60 text-[#FF5C62]",
          )}
        >
          Current plan
        </span>
      ) : isPaidPlan ? (
        <Link
          href={`/billing/plan/${plan.id}`}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-violet-300/40 transition-all hover:brightness-105 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#926efb]"
        >
          Get {plan.name}
        </Link>
      ) : (
        <span className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-500">
          {PLAN_CATALOG_COPY.trialFootnote}
        </span>
      )}
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);
  const { error } = await searchParams;

  const [member, plans, entitlement, currentSubscription, payments] =
    await Promise.all([
      prisma.members.findUnique({ where: { id: memberId } }),
      prisma.plans.findMany({ orderBy: { id: "asc" } }),
      getMemberEntitlement(memberId, { applyAdminBypass: false }),
      prisma.member_plan.findFirst({
        where: { member_id: memberId },
        orderBy: { id: "desc" },
      }),
      prisma.member_payment.findMany({
        where: { member_id: memberId },
        orderBy: { id: "desc" },
        take: 10,
      }),
    ]);

  const activePlanId = member?.plan_id || 0;
  const isCancelled = Boolean(currentSubscription?.agreement_cancel);
  const humanStatus = resolveHumanStatus(entitlement.status, isCancelled);
  const detail = statusDetail(
    humanStatus,
    entitlement.planExpiry,
    entitlement.daysLeft,
  );

  const hasActivePaidAccess =
    entitlement.isPaid &&
    entitlement.planExpiry != null &&
    entitlement.planExpiry.getTime() > Date.now();

  const canCancel =
    hasActivePaidAccess &&
    !isCancelled &&
    Boolean(currentSubscription?.paypal_agreement_id);
  const canReactivate = isCancelled && hasActivePaidAccess;

  return (
    <div className="min-w-0 max-w-full space-y-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and choose a plan that fits your brands.
        </p>
      </div>

      <Suspense fallback={null}>
        <BillingErrorBanner initialError={error} />
      </Suspense>

      <Card className="min-w-0 border-rose-100/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Current status
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Badge
              variant={statusBadgeVariant(humanStatus)}
              className={cn(
                "min-h-8 px-3 text-sm capitalize",
                humanStatus === "trial" &&
                  "border-violet-200 bg-violet-50 text-violet-700",
                humanStatus === "free" &&
                  "border-rose-200 bg-rose-50 text-[#FF5C62]",
                humanStatus === "paid" && "bg-[#926efb] hover:bg-[#7c3aed]",
              )}
            >
              {statusLabel(humanStatus)}
            </Badge>
            {detail && (
              <span className="min-w-0 break-words text-sm text-muted-foreground">
                {detail}
              </span>
            )}
          </div>
          <BillingSubscriptionActions
            canCancel={canCancel}
            canReactivate={canReactivate}
          />
        </CardContent>
      </Card>

      <section className="min-w-0">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Plans
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a plan to upgrade — pay with card or PayPal.
          </p>
        </div>

        {/* Stack through 768 (lg starts at 1024); desktop keeps 2–3 cols */}
        <div className="w-full min-w-0 max-w-5xl space-y-10">
          {(() => {
            const catalogPlans = plans as CatalogPlan[];
            const { individuals, partners } =
              splitPlanAudiences(catalogPlans);

            return (
              <>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-gray-900">
                    For Individuals
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {PLAN_CATALOG_COPY.trialFootnote}
                  </p>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                    {individuals.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        plans={catalogPlans}
                        activePlanId={activePlanId}
                      />
                    ))}
                  </div>
                </div>

                {partners.length > 0 && (
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      For Partners &amp; Agencies
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Multi-brand plans for agencies and resellers.
                    </p>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                      {partners.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          plans={catalogPlans}
                          activePlanId={activePlanId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {PLAN_CATALOG_COPY.vnocFootnote}
                </p>
              </>
            );
          })()}
        </div>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="min-w-0 max-w-full overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Amount</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="py-2">
                        {new Date(
                          payment.datetime_created,
                        ).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        ${(payment.amount || 0).toFixed(2)}{" "}
                        {payment.currency || "USD"}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {payment.status || "pending"}
                        </Badge>
                      </td>
                      <td className="max-w-[150px] truncate py-2 font-mono text-xs">
                        {payment.transaction_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0"
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

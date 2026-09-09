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
import { cn } from "@/lib/utils";

type HumanBillingStatus = "trial" | "free" | "paid" | "cancelled";

function resolveHumanStatus(
  entitlementStatus: string,
  isCancelled: boolean,
): HumanBillingStatus {
  if (isCancelled) return "cancelled";
  if (entitlementStatus === "trial") return "trial";
  if (entitlementStatus === "paid") return "paid";
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
    default:
      return "Free";
  }
}

function statusDetail(
  status: HumanBillingStatus,
  planExpiry: Date | null,
  daysLeft: number | null,
): string | null {
  if (status === "free") {
    return "Free forever · caps apply";
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

function formatBrandLimit(value: number | null | undefined): string {
  if (value == null || value <= 0) return "Unlimited brands";
  return `Up to ${value} brand${value === 1 ? "" : "s"}`;
}

function formatParticipantLimit(value: number | null | undefined): string {
  if (value == null || value <= 0) {
    return "Unlimited participants/campaign";
  }
  return `${value} participants/campaign`;
}

function formatPlanDays(value: number | null | undefined): string {
  const days = value || 30;
  return `${days} day${days === 1 ? "" : "s"}`;
}

function formatPrice(price: number | null | undefined): string {
  return `$${(price || 0).toFixed(2)}`;
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
        <div className="w-full min-w-0 max-w-5xl">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            {plans.map((plan) => {
              const price = plan.price || 0;
              const isPaidPlan = price > 0;
              const isCurrent = activePlanId === plan.id;
              const accent = isPaidPlan ? "#926efb" : "#FF5C62";

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-md sm:p-6",
                    isCurrent &&
                      isPaidPlan &&
                      "border-2 border-[#926efb] ring-2 ring-[#926efb]/20",
                    isCurrent &&
                      !isPaidPlan &&
                      "border-2 border-[#FF5C62]/70 shadow-rose-100",
                    !isCurrent && isPaidPlan && "border-violet-200/80",
                    !isCurrent && !isPaidPlan && "border-rose-100/90",
                  )}
                >
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
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{plan.unit || "month"}
                      </span>
                    </div>
                  </div>

                  <ul className="flex-1 space-y-3">
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckIcon color={accent} />
                      {formatBrandLimit(plan.no_of_domains)}
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckIcon color={accent} />
                      {formatParticipantLimit(plan.campaigns_participants)}
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckIcon color={accent} />
                      {formatPlanDays(plan.days)}
                    </li>
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
                      Pay with card or PayPal
                    </Link>
                  ) : (
                    <span className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-medium text-gray-500">
                      Included in trial / free forever
                    </span>
                  )}
                </div>
              );
            })}
          </div>
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

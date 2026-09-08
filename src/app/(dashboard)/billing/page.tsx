import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BillingErrorBanner } from "@/components/billing/billing-error-banner";
import { BillingSubscriptionActions } from "@/components/billing/billing-subscription-actions";
import {
  DEFAULT_PAID_PLAN_ID,
  getMemberEntitlement,
} from "@/lib/member-subscription";
import { cn } from "@/lib/utils";

const freeFeatures = [
  "Widget keeps working on your site",
  "1 domain",
  "Up to 500 tracked participants",
  "Basic analytics",
  "Referrals.com branding on widget",
  "Data stays intact — never wiped",
];

const growthFeatures = [
  "Unlimited domains & campaigns",
  "Gamification & leaderboards",
  "Remove Referrals.com branding",
  "Advanced analytics",
  "All social sharing channels",
  "Custom reward rules",
  "Anti-fraud tracking",
  "Widget templates & embeds",
];

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);
  const { error } = await searchParams;

  const [entitlement, currentSubscription, payments] = await Promise.all([
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

  const isOnFree = humanStatus === "free";
  const isOnGrowth = humanStatus === "paid";
  const isOnTrial = humanStatus === "trial";
  const growthCheckoutHref = `/billing/plan/${DEFAULT_PAID_PLAN_ID}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan — free forever after trial, or Growth at $9/month per
          brand.
        </p>
      </div>

      <Suspense fallback={null}>
        <BillingErrorBanner initialError={error} />
      </Suspense>

      <Card className="border-rose-100/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Current status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
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
              <span className="text-sm text-muted-foreground">{detail}</span>
            )}
          </div>
          <BillingSubscriptionActions
            canCancel={canCancel}
            canReactivate={canReactivate}
          />
        </CardContent>
      </Card>

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Plans
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Same story as pricing — pick Free forever or unlock Growth.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
          {/* Free forever */}
          <div
            className={cn(
              "flex flex-col rounded-2xl border bg-white p-6 shadow-md sm:p-8",
              isOnFree
                ? "border-2 border-[#FF5C62]/70 shadow-rose-100"
                : "border-rose-100/90",
            )}
          >
            <div className="mb-6 rounded-xl bg-gradient-to-br from-rose-500/10 to-orange-50/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Free forever
                </h3>
                {isOnFree && (
                  <span className="shrink-0 rounded-full bg-[#FF5C62] px-2.5 py-1 text-xs font-semibold text-white">
                    Current
                  </span>
                )}
                {isOnTrial && (
                  <span className="shrink-0 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#FF5C62]">
                    After trial
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  $0
                </span>
                <span className="text-gray-500">/after 14-day trial</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Widget stays live. Caps apply. Branding on.
              </p>
            </div>

            <ul className="flex-1 space-y-3">
              {freeFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <CheckIcon color="#FF5C62" />
                  {feature}
                </li>
              ))}
            </ul>

            {isOnFree ? (
              <span className="mt-8 flex min-h-11 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/60 px-6 py-3.5 text-center text-sm font-semibold text-[#FF5C62]">
                You are on Free forever
              </span>
            ) : isOnTrial ? (
              <span className="mt-8 flex min-h-11 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/40 px-6 py-3.5 text-center text-sm font-medium text-gray-600">
                Your plan after the trial ends
              </span>
            ) : (
              <span className="mt-8 flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-6 py-3.5 text-center text-sm font-medium text-gray-500">
                Always available — no charge
              </span>
            )}
          </div>

          {/* Growth */}
          <div
            className={cn(
              "relative flex flex-col rounded-2xl border bg-white p-6 shadow-xl shadow-violet-200/40 sm:p-8",
              isOnGrowth
                ? "border-2 border-[#926efb] ring-2 ring-[#926efb]/25"
                : "border-violet-200/80 ring-2 ring-[#926efb]/25",
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
            {isOnTrial && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
                Included in your 14-day trial
              </span>
            )}
            {isOnGrowth && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
                Current plan
              </span>
            )}

            <div className="mb-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-rose-50/20 p-4">
              <h3 className="text-xl font-bold text-gray-900">Growth</h3>
              <div className="mt-3 flex flex-wrap items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  $9
                </span>
                <span className="text-gray-500">/month per brand</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Full product — remove branding, unlock domains &amp; analytics.
              </p>
            </div>

            <ul className="flex-1 space-y-3">
              {growthFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <CheckIcon color="#926efb" />
                  {feature}
                </li>
              ))}
            </ul>

            {isOnGrowth ? (
              <span className="mt-8 flex min-h-11 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-6 py-3.5 text-center text-sm font-semibold text-[#7c3aed]">
                You are on Growth
              </span>
            ) : (
              <Link
                href={growthCheckoutHref}
                className="mt-8 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-violet-300/40 transition-all hover:brightness-105 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#926efb]"
              >
                {isOnTrial
                  ? "Keep Growth after trial"
                  : humanStatus === "cancelled"
                    ? "Resubscribe to Growth"
                    : "Upgrade to Growth"}
              </Link>
            )}
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
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

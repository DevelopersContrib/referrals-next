import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PayPalCheckout } from "@/components/billing/paypal-checkout";
import { FREE_PARTICIPANT_CAP } from "@/lib/billing-constants";
import { cn } from "@/lib/utils";

export default async function PlanCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ brandId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { planId } = await params;
  const { brandId } = await searchParams;

  const id = parseInt(planId, 10);
  if (Number.isNaN(id)) notFound();

  const plan = await prisma.plans.findUnique({ where: { id } });
  if (!plan) notFound();

  const price = Number(plan.price ?? 0);
  const unit = plan.unit || "month";
  const isPaid = price > 0;
  const priceLabel = `$${price.toFixed(2)}/${unit}`;
  const parsedBrandId = brandId ? parseInt(brandId, 10) : null;
  const brand =
    parsedBrandId && Number.isFinite(parsedBrandId)
      ? await prisma.member_urls.findFirst({
          where: {
            id: parsedBrandId,
            member_id: parseInt(session.user.id, 10),
          },
          select: { id: true, domain: true },
        })
      : null;

  const accent = isPaid ? "#926efb" : "#FF5C62";
  const includes = [
    "Remove Referrals.com branding from your widget",
    plan.no_of_domains && plan.no_of_domains > 0
      ? `Up to ${plan.no_of_domains} brand${plan.no_of_domains === 1 ? "" : "s"}`
      : "Add more brands as you grow",
    plan.campaigns_participants && plan.campaigns_participants > 0
      ? `${plan.campaigns_participants.toLocaleString()} participants per campaign`
      : `Grow past the free ${FREE_PARTICIPANT_CAP}-participant cap`,
    "Public campaign pages and leaderboards",
    "Advanced analytics and performance charts",
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-24 sm:pb-6">
      <Link
        href="/billing"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeftIcon className="size-4" />
        Back to billing
      </Link>

      <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
        {/* Plan details — matches /billing Available Plans cards */}
        <div
          className={cn(
            "relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-md sm:p-6 lg:p-8",
            isPaid
              ? "border-violet-200/80 ring-2 ring-[#926efb]/25 shadow-xl shadow-violet-200/40"
              : "border-rose-100/90",
          )}
        >
          {isPaid && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
          )}
          {isPaid && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
              Growth checkout
            </span>
          )}

          <div
            className={cn(
              "mb-5 rounded-xl p-4",
              isPaid
                ? "bg-gradient-to-br from-violet-500/10 to-rose-50/20"
                : "bg-gradient-to-br from-rose-500/10 to-orange-50/30",
            )}
          >
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                isPaid ? "text-[#926efb]" : "text-[#FF5C62]",
              )}
            >
              {isPaid ? "Growth plan" : "Plan"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {plan.name || `Plan ${plan.id}`}
            </h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                ${price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                /{unit}
                {brand ? ` · ${brand.domain}` : " · per brand"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {plan.days || 30}-day billing cycle. Cancel anytime — your widget
              keeps running on free forever (capped) if you stop.
            </p>
          </div>

          <ul className="flex-1 space-y-3">
            {includes.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <PlanCheckIcon color={accent} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Checkout panel */}
        <div
          className={cn(
            "relative flex w-full min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-md sm:p-6 lg:p-8",
            isPaid ? "border-violet-200/80" : "border-rose-100/90",
          )}
        >
          {isPaid ? (
            <>
              <div className="mb-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-rose-50/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#926efb]">
                  Payment
                </p>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    Total today
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-gray-900">
                    {priceLabel}
                  </span>
                </div>
                {brand?.domain && (
                  <p className="mt-1 text-sm text-gray-500">
                    For brand · {brand.domain}
                  </p>
                )}
              </div>
              <PayPalCheckout
                planId={plan.id}
                brandId={brand?.id ?? null}
                priceLabel={priceLabel}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col justify-center space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-rose-500/10 to-orange-50/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FF5C62]">
                  Free plan
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  This plan has no charge.
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Your 14-day Growth trial starts automatically at signup, and
                  free forever (capped) continues after it ends. Choose Growth
                  to unlock branding removal and higher limits.
                </p>
              </div>
              <Link
                href="/billing"
                className="flex min-h-11 items-center justify-center rounded-xl bg-[#FF5C62] px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C62]"
              >
                View plans
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanCheckIcon({ color }: { color: string }) {
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

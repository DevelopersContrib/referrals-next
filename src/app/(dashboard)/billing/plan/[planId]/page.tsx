import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PayPalCheckout } from "@/components/billing/paypal-checkout";
import { FREE_PARTICIPANT_CAP } from "@/lib/billing-constants";

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
          where: { id: parsedBrandId, member_id: parseInt(session.user.id, 10) },
          select: { id: true, domain: true },
        })
      : null;

  const includes = [
    "Remove Referrals.com branding from your widget",
    plan.no_of_domains
      ? `Up to ${plan.no_of_domains} brand${plan.no_of_domains === 1 ? "" : "s"}`
      : "Add more brands as you grow",
    plan.campaigns_participants
      ? `${plan.campaigns_participants.toLocaleString()} participants per campaign`
      : `Grow past the free ${FREE_PARTICIPANT_CAP}-participant cap`,
    "Public campaign pages and leaderboards",
    "Advanced analytics and performance charts",
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-24 sm:pb-6">
      <Link
        href="/billing"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ArrowLeftIcon className="size-4" />
        Back to billing
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card className="order-2 lg:order-1">
          <CardContent className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {isPaid ? "Growth plan" : "Plan"}
            </p>
            <h1 className="mt-1 text-2xl font-bold capitalize text-[#464457] sm:text-3xl">
              {plan.name || `Plan ${plan.id}`}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-4xl font-extrabold tracking-tight text-[#464457]">
                ${price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground">
                per {unit}
                {brand ? ` · ${brand.domain}` : " · per brand"}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {plan.days || 30}-day billing cycle. Cancel anytime — your widget keeps
              running on free forever (capped) if you stop.
            </p>

            <ul className="mt-5 space-y-2.5">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-[#575962]">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2 lg:sticky lg:top-6">
          <CardContent className="p-5 sm:p-6">
            {isPaid ? (
              <>
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[#ebeef0] pb-4">
                  <span className="text-sm font-medium text-[#575962]">Total today</span>
                  <span className="text-xl font-bold text-[#464457]">{priceLabel}</span>
                </div>
                <PayPalCheckout
                  planId={plan.id}
                  brandId={brand?.id ?? null}
                  priceLabel={priceLabel}
                />
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-[#464457]">
                  This plan has no charge.
                </p>
                <p className="text-muted-foreground">
                  Your 14-day Growth trial starts automatically at signup, and free
                  forever (capped) continues after it ends. Choose Growth to unlock
                  branding removal and higher limits.
                </p>
                <Link
                  href="/billing"
                  className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  View plans
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

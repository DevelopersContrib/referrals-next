import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  CrownIcon,
  GlobeIcon,
  RocketIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandLogo } from "@/components/brands/brand-logo";
import { PublishGainCalculator } from "@/components/campaigns/publish-gain-calculator";
import { BrandCancelButton } from "@/components/billing/brand-cancel-button";
import { isVnocBrand } from "@/lib/member-subscription";
import {
  AGENCY_10_PLAN_ID,
  AGENCY_50_PLAN_ID,
  BRAND_MONTHLY_PLAN_ID,
  BRAND_YEARLY_PLAN_ID,
  PLAN_PUBLIC_NAME,
} from "@/lib/billing-constants";

export const metadata: Metadata = {
  title: "Brand billing",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ brandId: string }> };

type Coverage =
  | { kind: "network" }
  | { kind: "own"; planId: number; expiry: Date; subscriptionId: string | null; cancelled: boolean }
  | { kind: "agency"; planId: number; expiry: Date; position: number; cap: number }
  | { kind: "none" };

/** Request time for this server render (kept out of the components themselves). */
function requestTime(): number {
  return Date.now();
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default async function BrandBillingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const { brandId: raw } = await params;
  const brandId = parseInt(raw, 10);
  if (Number.isNaN(brandId)) notFound();

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: {
      id: true,
      member_id: true,
      domain: true,
      logo_url: true,
      plan_expiry: true,
      in_vnoc: true,
      vnoc_id: true,
    },
  });
  if (!brand || brand.member_id !== memberId) notFound();

  const [member, plans, urlPlan, memberBrands, payments, latestCampaign, campaignCount, participantRows] =
    await Promise.all([
      prisma.members.findUnique({
        where: { id: memberId },
        select: { plan_id: true, plan_expiry: true },
      }),
      prisma.plans.findMany({
        where: {
          id: { in: [BRAND_MONTHLY_PLAN_ID, BRAND_YEARLY_PLAN_ID, AGENCY_10_PLAN_ID, AGENCY_50_PLAN_ID] },
        },
        select: { id: true, price: true, no_of_domains: true, days: true },
      }),
      prisma.url_plan.findFirst({
        where: { url_id: brandId },
        orderBy: { id: "desc" },
        select: { payment_id: true, paypal_agreement_id: true, agreement_cancel: true },
      }),
      prisma.member_urls.findMany({
        where: { member_id: memberId },
        orderBy: { date_added: "asc" },
        select: { id: true, in_vnoc: true, vnoc_id: true },
      }),
      prisma.member_payment.findMany({
        where: { url_id: brandId },
        orderBy: { id: "desc" },
        take: 24,
        select: {
          id: true,
          datetime_created: true,
          amount: true,
          currency: true,
          status: true,
          transaction_id: true,
        },
      }),
      prisma.member_campaigns.findFirst({
        where: { url_id: brandId },
        orderBy: { id: "desc" },
        select: { id: true },
      }),
      prisma.member_campaigns.count({ where: { url_id: brandId } }),
      prisma.$queryRawUnsafe<{ c: bigint }[]>(
        `SELECT COUNT(*) AS c FROM campaign_participants cp
         JOIN member_campaigns mc ON mc.id = cp.campaign_id
         WHERE mc.url_id = ? AND LOWER(cp.email) NOT LIKE '%@network.referrals.com'`,
        brandId,
      ),
    ]);

  // Plans this member is actually on (agency, legacy Unlimited) may not be in the list above.
  const extraIds = [member?.plan_id, urlPlan?.payment_id].filter(
    (id): id is number => typeof id === "number" && id > 0 && !plans.some((p) => p.id === id),
  );
  if (extraIds.length) {
    plans.push(
      ...(await prisma.plans.findMany({
        where: { id: { in: extraIds } },
        select: { id: true, price: true, no_of_domains: true, days: true },
      })),
    );
  }
  const priceOf = (id: number) => plans.find((p) => p.id === id)?.price ?? null;
  const monthly = priceOf(BRAND_MONTHLY_PLAN_ID) ?? 9;
  const yearly = priceOf(BRAND_YEARLY_PLAN_ID) ?? 99;
  const agency10 = priceOf(AGENCY_10_PLAN_ID) ?? 70;
  const agency50 = priceOf(AGENCY_50_PLAN_ID) ?? 350;
  const yearlySaving = Math.max(0, monthly * 12 - yearly);
  const participants = Number(participantRows[0]?.c ?? 0);
  const countableBrands = memberBrands.filter((b) => !isVnocBrand(b));
  const brandCount = countableBrands.length;
  const now = requestTime();

  // ── What pays for this brand? ──
  let coverage: Coverage = { kind: "none" };
  if (isVnocBrand(brand)) {
    coverage = { kind: "network" };
  } else {
    // Only a single-brand plan is this brand's "own" plan; agency checkouts are
    // also recorded on the brand they started from, but they pay for the account.
    const stamped = urlPlan?.payment_id ? plans.find((p) => p.id === urlPlan.payment_id) : null;
    const ownPlan = stamped && (stamped.no_of_domains ?? 1) === 1 ? stamped : null;
    const ownExpiry = brand.plan_expiry ? new Date(brand.plan_expiry) : null;
    const accountPlan = member?.plan_id ? plans.find((p) => p.id === member.plan_id) : null;
    const accountExpiry = member?.plan_expiry ? new Date(member.plan_expiry) : null;
    const accountIsAgency =
      accountPlan && (accountPlan.no_of_domains ?? 1) !== 1 && (accountPlan.price ?? 0) > 0;
    const position = countableBrands.findIndex((b) => b.id === brandId) + 1;
    // A negative or missing brand limit on a paid account plan means unlimited.
    const cap = !accountPlan
      ? 0
      : accountPlan.no_of_domains && accountPlan.no_of_domains > 0
        ? accountPlan.no_of_domains
        : Number.POSITIVE_INFINITY;

    if (ownPlan && (ownPlan.price ?? 0) > 0 && ownExpiry && ownExpiry.getTime() > now) {
      coverage = {
        kind: "own",
        planId: ownPlan.id,
        expiry: ownExpiry,
        subscriptionId: urlPlan?.paypal_agreement_id ?? null,
        cancelled: Boolean(urlPlan?.agreement_cancel),
      };
    } else if (
      accountIsAgency &&
      accountExpiry &&
      accountExpiry.getTime() > now &&
      position > 0 &&
      position <= cap
    ) {
      coverage = { kind: "agency", planId: accountPlan.id, expiry: accountExpiry, position, cap };
    }
  }

  // Paying $9 for a brand an active agency plan already covers.
  const accountAgencyActive =
    coverage.kind === "own" &&
    member?.plan_id &&
    [AGENCY_10_PLAN_ID, AGENCY_50_PLAN_ID].includes(member.plan_id as 4 | 5) &&
    member.plan_expiry &&
    new Date(member.plan_expiry).getTime() > now;

  const goLive = latestCampaign ? `&goLiveCampaign=${latestCampaign.id}` : "";
  const checkout = (planId: number) => `/billing/plan/${planId}?brandId=${brandId}${goLive}`;
  const isLive = coverage.kind !== "none";
  const separateCost = brandCount * monthly;
  const agencyBestFit = brandCount >= Math.ceil(agency10 / monthly); // 8 brands at $9 vs $70

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/brands/${brandId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" /> Back to {brand.domain}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <BrandLogo
          domain={brand.domain}
          logoUrl={brand.logo_url}
          imgClassName="h-14 w-14 rounded-xl border bg-white object-contain p-1"
          fallbackClassName="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-500"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Billing</p>
          <h1
            className="truncate text-2xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            {brand.domain}
          </h1>
        </div>
        <StatusPill coverage={coverage} />
      </div>

      {/* State */}
      {coverage.kind === "network" && (
        <Panel tone="emerald" icon={<GlobeIcon className="size-5" />} title={`${brand.domain} is a network brand`}>
          Network brands are always live and never billed. Nothing to do here.
        </Panel>
      )}

      {coverage.kind === "agency" && (
        <Panel
          tone="violet"
          icon={<BuildingIcon className="size-5" />}
          title={`Included in your ${PLAN_PUBLIC_NAME[coverage.planId] ?? "Agency"} plan`}
        >
          <p>
            {Number.isFinite(coverage.cap) ? (
              <>
                {brand.domain} is brand <strong>{coverage.position}</strong> of{" "}
                <strong>{coverage.cap}</strong> on your plan, so it has no separate charge.
              </>
            ) : (
              <>Your plan covers every brand, so {brand.domain} has no separate charge.</>
            )}
            Your plan renews on <strong>{fmtDate(coverage.expiry)}</strong>.
          </p>
          <Link
            href="/billing"
            className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#7c3aed] px-4 text-sm font-semibold text-white hover:bg-[#6d28d9]"
          >
            Manage your agency plan
          </Link>
        </Panel>
      )}

      {coverage.kind === "own" && (
        <LivePlanCard
          brandId={brandId}
          brandName={brand.domain}
          hasSubscription={Boolean(coverage.subscriptionId)}
          cancelled={coverage.cancelled}
          planId={coverage.planId}
          expiry={coverage.expiry}
          price={priceOf(coverage.planId) ?? monthly}
          yearlySaving={yearlySaving}
          switchToYearlyHref={coverage.planId === BRAND_MONTHLY_PLAN_ID ? "/billing" : null}
          participants={participants}
          campaigns={campaignCount}
          doublePaying={Boolean(accountAgencyActive)}
          now={now}
        />
      )}

      {!isLive && (
        <section aria-labelledby="choose-plan" className="space-y-5">
          <div>
            <h2
              id="choose-plan"
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-dosis), sans-serif" }}
            >
              Put {brand.domain} live
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Pick how you&apos;d like to pay. Every option includes every feature, and you can
              cancel anytime.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <PlanCard
              title="Monthly"
              price={`$${monthly}`}
              unit="/month"
              blurb="Start today, stop whenever you like."
              perks={["Live in minutes", "Cancel anytime", "Every feature included"]}
              href={checkout(BRAND_MONTHLY_PLAN_ID)}
              cta="Publish monthly"
            />
            <PlanCard
              highlight
              badge={yearlySaving > 0 ? `Save $${yearlySaving}` : "Best value"}
              title="Yearly"
              price={`$${yearly}`}
              unit="/year"
              blurb={`About $${(yearly / 12).toFixed(2)} a month — one month free.`}
              perks={[
                yearlySaving > 0 ? `$${yearlySaving} less than paying monthly` : "Lowest price per month",
                "Price locked for 12 months",
                "One payment, no monthly charges",
              ]}
              href={checkout(BRAND_YEARLY_PLAN_ID)}
              cta="Publish yearly"
            />
            <PlanCard
              badge={agencyBestFit ? "Best fit for you" : undefined}
              title="Agency"
              price={`$${agency10}`}
              unit="/month for 10 brands"
              blurb={
                brandCount > 1
                  ? `You have ${brandCount} brands. Separate plans cost $${separateCost}/mo.`
                  : "For agencies and owners running several brands."
              }
              perks={[
                `Up to 10 brands ($${(agency10 / 10).toFixed(0)} each)`,
                `Agency 50: $${agency50}/mo for 50 brands`,
                agencyBestFit
                  ? `Saves $${separateCost - agency10}/mo vs separate plans`
                  : `Cheaper than separate plans from ${Math.ceil(agency10 / monthly)} brands`,
              ]}
              href={checkout(AGENCY_10_PLAN_ID)}
              cta="Get Agency 10"
              tone="violet"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              Here&apos;s what {brand.domain} could bring in
            </p>
            <PublishGainCalculator />
          </div>
        </section>
      )}

      {/* History */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Payments for {brand.domain}</h2>
          <Link href="/billing" className="text-sm font-medium text-[#d63a40] hover:underline">
            All brands and payments →
          </Link>
        </div>
        {coverage.kind === "agency" ? (
          <p className="mt-3 text-sm text-gray-600">
            This brand is paid through your agency plan. Its payments are on the{" "}
            <Link href="/billing" className="font-medium text-[#7c3aed] underline">
              main Billing page
            </Link>
            .
          </p>
        ) : payments.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No payments for this brand yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{fmtDate(new Date(p.datetime_created))}</td>
                    <td className="py-2">
                      ${(p.amount ?? 0).toFixed(2)} {p.currency || "USD"}
                    </td>
                    <td className="py-2 capitalize">{p.status || "pending"}</td>
                    <td className="max-w-[160px] truncate py-2 font-mono text-xs text-gray-500">
                      {p.transaction_id || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ coverage }: { coverage: Coverage }) {
  const map = {
    network: { label: "Network · free", cls: "bg-emerald-100 text-emerald-800" },
    own: { label: "Live", cls: "bg-emerald-100 text-emerald-800" },
    agency: { label: "Live · Agency", cls: "bg-violet-100 text-violet-800" },
    none: { label: "Private", cls: "bg-amber-100 text-amber-900" },
  } as const;
  const s = map[coverage.kind];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Panel({
  tone,
  icon,
  title,
  children,
}: {
  tone: "emerald" | "violet";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-violet-200 bg-violet-50 text-violet-950";
  return (
    <section className={`rounded-2xl border p-5 ${cls}`}>
      <p className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}

function PlanCard({
  title,
  price,
  unit,
  blurb,
  perks,
  href,
  cta,
  badge,
  highlight = false,
  tone = "rose",
}: {
  title: string;
  price: string;
  unit: string;
  blurb: string;
  perks: string[];
  href: string;
  cta: string;
  badge?: string;
  highlight?: boolean;
  tone?: "rose" | "violet";
}) {
  const btn =
    tone === "violet" ? "bg-[#7c3aed] hover:bg-[#6d28d9]" : "bg-[#d63a40] hover:bg-[#c2343a]";
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
        highlight ? "border-[#d63a40] ring-2 ring-[#d63a40]/20" : "border-gray-200"
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-5 rounded-full px-3 py-0.5 text-xs font-bold text-white ${
            tone === "violet" ? "bg-[#7c3aed]" : "bg-[#d63a40]"
          }`}
        >
          {badge}
        </span>
      )}
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{price}</span>
        <span className="text-sm text-gray-500">{unit}</span>
      </p>
      <p className="mt-2 text-sm text-gray-600">{blurb}</p>
      <ul className="mt-4 flex-1 space-y-2">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ${btn}`}
      >
        <RocketIcon className="size-4" aria-hidden="true" />
        {cta}
      </Link>
    </div>
  );
}

function LivePlanCard({
  brandId,
  brandName,
  hasSubscription,
  cancelled,
  planId,
  expiry,
  price,
  yearlySaving,
  switchToYearlyHref,
  participants,
  campaigns,
  doublePaying,
  now,
}: {
  brandId: number;
  brandName: string;
  hasSubscription: boolean;
  cancelled: boolean;
  planId: number;
  expiry: Date;
  price: number;
  yearlySaving: number;
  switchToYearlyHref: string | null;
  participants: number;
  campaigns: number;
  doublePaying: boolean;
  now: number;
}) {
  const isYearly = planId === BRAND_YEARLY_PLAN_ID;
  const periodDays = isYearly ? 365 : 30;
  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now) / 86_400_000));
  const pct = Math.min(100, Math.max(4, Math.round((daysLeft / periodDays) * 100)));
  const renews = hasSubscription && !cancelled;
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-950">
          <CrownIcon className="size-5" aria-hidden="true" /> {brandName} is live
        </p>
        <p className="mt-1 text-sm text-emerald-900">
          {PLAN_PUBLIC_NAME[planId] ?? "Brand plan"} · ${price}
          {isYearly ? "/year" : "/month"}
        </p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <Stat icon={<UsersIcon className="size-4" />} label="People in your program" value={participants.toLocaleString()} />
        <Stat icon={<SparklesIcon className="size-4" />} label="Campaigns" value={campaigns.toLocaleString()} />
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarIcon className="size-4" aria-hidden="true" />{" "}
            {renews ? "Renews" : "Ends"} {fmtDate(expiry)}
          </p>
          <div className="mt-2 h-2 rounded-full bg-gray-200" aria-hidden="true">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-600">{daysLeft} days left in this period</p>
        </div>
      </div>
      {doublePaying && renews && (
        <p className="mx-5 mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Your agency plan already covers this brand. Cancel this brand&apos;s own plan below to
          stop paying twice.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-4">
        {/* Never start a second checkout here: that would bill monthly and
            yearly at once. Switching happens on the Billing page. */}
        {renews ? (
          <>
            {switchToYearlyHref && yearlySaving > 0 && (
              <span className="text-sm text-gray-700">
                Yearly saves ${yearlySaving} a year.
              </span>
            )}
            <BrandCancelButton brandId={brandId} brandName={brandName} liveUntil={fmtDate(expiry)} />
          </>
        ) : (
          <span className="text-sm text-gray-700">
            {cancelled ? "Cancelled. " : "No recurring charge. "}
            {brandName} stays live until {fmtDate(expiry)}, then goes private. You can publish it
            again from this page after that.
          </span>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

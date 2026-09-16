"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import { cn } from "@/lib/utils";

const DOSIS: React.CSSProperties = {
  fontFamily: "var(--font-dosis), sans-serif",
};

type Props = {
  isVerified: boolean;
  /** Growth entitled (trial or paid) */
  isGrowth: boolean;
  status?: "trial" | "free_capped" | "unpaid" | "paid" | "unverified";
  daysLeft?: number | null;
  checkoutBrandId?: number | null;
  checkoutBrandDomain?: string | null;
};

export function PaidOnboardingBanner(props: Props) {
  return (
    <Suspense fallback={null}>
      <PaidOnboardingBannerInner {...props} />
    </Suspense>
  );
}

function PaidOnboardingBannerInner(props: Props) {
  const searchParams = useSearchParams();
  const preview = readDevPreview(searchParams.get("previewBanner"));
  const {
    isVerified,
    isGrowth,
    status,
    daysLeft,
    checkoutBrandId,
    checkoutBrandDomain,
  } = preview ? previewOnboarding(preview) : props;

  const upgradeHref = checkoutBrandId
    ? `/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${checkoutBrandId}`
    : `/billing/plan/${DEFAULT_PAID_PLAN_ID}`;

  if (isVerified && status === "paid") return null;
  if (isVerified && status === "free_capped") return null;

  if (isVerified && status === "unpaid" && checkoutBrandId) {
    return (
      <UnpaidBrandCard
        domain={checkoutBrandDomain ?? "this brand"}
        upgradeHref={upgradeHref}
      />
    );
  }

  if (isVerified && status === "trial") {
    const isEndingSoon = daysLeft != null && daysLeft <= 3;
    return (
      <TrialKeepGrowthCard
        daysLeft={daysLeft}
        isEndingSoon={isEndingSoon}
        domain={checkoutBrandDomain}
        upgradeHref={upgradeHref}
      />
    );
  }

  if (isVerified && isGrowth) return null;

  return (
    <SetupProgressCard
      isVerified={isVerified}
      status={status}
      daysLeft={daysLeft}
      upgradeHref={upgradeHref}
      checkoutBrandDomain={checkoutBrandDomain}
    />
  );
}

function UnpaidBrandCard({
  domain,
  upgradeHref,
}: {
  domain: string;
  upgradeHref: string;
}) {
  return (
    <section
      aria-labelledby="unpaid-brand-heading"
      className="@container relative mb-5 overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm"
    >
      <GradientAccent />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 sm:ps-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Unpaid brand
          </p>
          <h2
            id="unpaid-brand-heading"
            className="mt-1 text-balance text-lg font-bold tracking-tight text-foreground sm:text-xl"
            style={DOSIS}
          >
            Keep Growth on {domain}
          </h2>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-sidebar-foreground">
            Your trial ended. Pay $9/mo for this brand to remove branding and
            unlock full analytics. Your widget stays live for visitors.
          </p>
        </div>
        <UpgradeCta href={upgradeHref} className="sm:w-auto">
          Growth — $9/mo for this brand
        </UpgradeCta>
      </div>
    </section>
  );
}

function TrialKeepGrowthCard({
  daysLeft,
  isEndingSoon,
  domain,
  upgradeHref,
}: {
  daysLeft: number | null | undefined;
  isEndingSoon: boolean;
  domain?: string | null;
  upgradeHref: string;
}) {
  const headingId = "trial-keep-growth-heading";
  const timeLabel = formatTrialTimeLeft(daysLeft);
  const brandLabel = domain ?? "this brand";

  return (
    <section
      aria-labelledby={headingId}
      className="@container relative mb-5 overflow-hidden rounded-2xl border border-portlet-border bg-white shadow-sm"
    >
      <GradientAccent />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 sm:ps-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-violet">
            Growth trial
          </p>
          <h2
            id={headingId}
            className="mt-1 text-balance text-lg font-bold tracking-tight text-foreground sm:text-xl"
            style={DOSIS}
          >
            {timeLabel}
            {" · "}
            Keep {brandLabel}
          </h2>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-sidebar-foreground">
            {isEndingSoon
              ? `Trial ends soon — pay $9/mo for ${brandLabel} to keep Growth.`
              : `Full features are unlocked during trial. After that, pay $9/mo for ${brandLabel}.`}
          </p>
        </div>
        <UpgradeCta href={upgradeHref} className="sm:w-auto">
          Keep {brandLabel} — $9/mo
        </UpgradeCta>
      </div>
    </section>
  );
}

function SetupProgressCard({
  isVerified,
  status,
  daysLeft,
  upgradeHref,
  checkoutBrandDomain,
}: {
  isVerified: boolean;
  status?: Props["status"];
  daysLeft?: number | null;
  upgradeHref: string;
  checkoutBrandDomain?: string | null;
}) {
  const brandLabel = checkoutBrandDomain ?? "this brand";
  const steps = [
    {
      id: "verify",
      label: "Verify your email",
      done: isVerified,
      href: null as string | null,
      cta: null as string | null,
      hint: "Use the link we sent so your Growth trial unlocks.",
    },
    {
      id: "billing",
      label:
        status === "trial" && daysLeft != null && daysLeft <= 3
          ? `Keep ${brandLabel}`
          : "Explore Growth",
      done: status === "paid",
      href: upgradeHref,
      cta: "Growth — $9/mo for this brand",
      hint:
        status === "trial"
          ? `Trial ends in ${daysLeft ?? "?"} day(s) — then $9/mo for ${brandLabel}.`
          : "Subscribe per brand to remove branding and unlock full Growth.",
    },
  ];

  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="group relative mb-5 overflow-hidden rounded-2xl border border-amber-200/70 bg-linear-to-br from-amber-50 via-white to-rose-50/60 p-px shadow-sm">
      <div className="relative rounded-2xl bg-white/70 px-4 py-4 backdrop-blur-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30">
              <RocketIcon className="size-5" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-950">
                {status === "trial" ? "Growth trial" : "Finish setup"}
                <SparklesIcon className="size-3.5 text-amber-500" />
              </p>
              <p className="text-xs text-amber-900/70">
                14-day full product — then $9/mo per external brand.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-amber-200/80">
            <span className="text-xs font-semibold text-amber-950">
              {completed}/{total} done
            </span>
            <span className="text-[11px] font-bold text-rose-500">{pct}%</span>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-400 to-rose-500 transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ol className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                s.done
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-amber-200/80 bg-white hover:border-rose-300"
              }`}
            >
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  s.done
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                }`}
              >
                {s.done ? <CheckCircle2Icon className="size-4" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    s.done
                      ? "text-emerald-700 line-through decoration-emerald-400"
                      : "text-amber-950"
                  }`}
                >
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{s.hint}</p>
                {s.href && !s.done && (
                  <Link
                    href={s.href}
                    className="mt-1.5 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-rose-600 hover:gap-1.5 hover:text-rose-700"
                  >
                    {s.cta ?? "Continue"}
                    <ArrowRightIcon className="size-3 transition-transform" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function GradientAccent() {
  return (
    <div
      aria-hidden
      className="h-1 bg-linear-to-r from-brand to-brand-violet md:absolute md:inset-y-0 md:inset-s-0 md:h-auto md:w-1 md:bg-linear-to-b"
    />
  );
}

function UpgradeCta({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm shadow-brand/25",
        "transition-colors hover:bg-brand-hover",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      {children}
      <ArrowRightIcon className="size-4" aria-hidden />
    </Link>
  );
}

function formatTrialTimeLeft(daysLeft: number | null | undefined) {
  if (daysLeft == null) return "Active";
  if (daysLeft <= 0) return "Last day";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}

type BannerPreview = "trial";

function readDevPreview(value: string | null): BannerPreview | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (value === "trial") return value;
  return null;
}

function previewOnboarding(_preview: BannerPreview): Props {
  return {
    isVerified: true,
    isGrowth: true,
    status: "trial",
    daysLeft: 2,
    checkoutBrandId: 1,
    checkoutBrandDomain: "example.com",
  };
}

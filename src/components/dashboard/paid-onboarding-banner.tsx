"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  GlobeIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";
import { cn } from "@/lib/utils";

const GROWTH_PLAN_HREF = `/billing/plan/${DEFAULT_PAID_PLAN_ID}`;

const DOSIS: React.CSSProperties = {
  fontFamily: "var(--font-dosis), sans-serif",
};

const GROWTH_CHIPS = [
  { id: "branding", label: "Remove branding", Icon: SparklesIcon },
  { id: "brands", label: "More brands", Icon: GlobeIcon },
  { id: "stats", label: "Advanced stats", Icon: BarChart3Icon },
] as const;

type Props = {
  isVerified: boolean;
  /** Growth entitled (trial or paid) */
  isGrowth: boolean;
  status?: "trial" | "free_capped" | "paid" | "unverified";
  daysLeft?: number | null;
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
  const { isVerified, isGrowth, status, daysLeft } = preview
    ? previewOnboarding(preview)
    : props;

  if (isVerified && status === "paid") return null;

  if (isVerified && status === "free_capped") {
    return <FreeCappedUpgradeCard />;
  }

  if (isVerified && status === "trial") {
    const isEndingSoon = daysLeft != null && daysLeft <= 3;
    return (
      <TrialKeepGrowthCard daysLeft={daysLeft} isEndingSoon={isEndingSoon} />
    );
  }

  if (isVerified && isGrowth) return null;

  return (
    <SetupProgressCard
      isVerified={isVerified}
      status={status}
      daysLeft={daysLeft}
    />
  );
}

function FreeCappedUpgradeCard() {
  return (
    <section
      aria-labelledby="growth-upgrade-heading"
      className="@container relative mb-5 overflow-hidden rounded-2xl border border-portlet-border bg-white shadow-sm"
    >
      <GradientAccent />
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:ps-7">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-violet">
            Free forever
          </p>
          <h2
            id="growth-upgrade-heading"
            className="mt-1 text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            style={DOSIS}
          >
            Keep your widget. Unlock Growth.
          </h2>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-sidebar-foreground">
            Your campaign stays live. Growth removes Referrals.com branding and
            unlocks more brands, leaderboards, and full stats.
          </p>
          <ul
            className="mt-3 flex flex-wrap gap-2"
            aria-label="Included with Growth"
          >
            {GROWTH_CHIPS.map(({ id, label, Icon }) => (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-portlet-border bg-dashboard-bg px-2.5 py-1 text-xs font-medium text-sidebar-foreground"
              >
                <Icon
                  className="size-3.5 shrink-0 text-brand-violet"
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <UpgradeCta className="md:w-auto">Upgrade to Growth — $9/mo</UpgradeCta>
      </div>
    </section>
  );
}

function TrialKeepGrowthCard({
  daysLeft,
  isEndingSoon,
}: {
  daysLeft: number | null | undefined;
  isEndingSoon: boolean;
}) {
  const headingId = "trial-keep-growth-heading";
  const timeLabel = formatTrialTimeLeft(daysLeft);

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
            Keep Growth
          </h2>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-sidebar-foreground">
            {isEndingSoon
              ? "Full features stay unlocked if you continue at $9/mo."
              : "Full features are unlocked. Keep them for $9/mo after trial."}
          </p>
        </div>
        <UpgradeCta className="sm:w-auto">Keep Growth — $9/mo</UpgradeCta>
      </div>
    </section>
  );
}

function SetupProgressCard({
  isVerified,
  status,
  daysLeft,
}: {
  isVerified: boolean;
  status?: Props["status"];
  daysLeft?: number | null;
}) {
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
          ? "Keep Growth"
          : "Explore Growth",
      done: status === "paid",
      href: GROWTH_PLAN_HREF,
      cta: "View $9/mo plan",
      hint:
        status === "trial"
          ? `Trial ends in ${daysLeft ?? "?"} day(s) — then free forever (capped).`
          : "Subscribe to remove branding and unlock full Growth.",
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
                14-day full product — then free forever (capped) or $9/mo.
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
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={GROWTH_PLAN_HREF}
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

type BannerPreview = "free_capped" | "trial";

function readDevPreview(value: string | null): BannerPreview | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (value === "free_capped" || value === "trial") return value;
  return null;
}

function previewOnboarding(preview: BannerPreview): Props {
  if (preview === "free_capped") {
    return {
      isVerified: true,
      isGrowth: false,
      status: "free_capped",
      daysLeft: 0,
    };
  }
  return {
    isVerified: true,
    isGrowth: true,
    status: "trial",
    daysLeft: 2,
  };
}

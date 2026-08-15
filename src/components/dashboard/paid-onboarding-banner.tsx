"use client";

import Link from "next/link";
import { CheckCircle2Icon, RocketIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";

type Props = {
  isVerified: boolean;
  /** Growth entitled (trial or paid) */
  isGrowth: boolean;
  status?: "trial" | "free_capped" | "paid" | "unverified";
  daysLeft?: number | null;
};

export function PaidOnboardingBanner({
  isVerified,
  isGrowth,
  status,
  daysLeft,
}: Props) {
  if (isVerified && status === "paid") return null;
  if (isVerified && status === "trial" && (daysLeft == null || daysLeft > 3)) {
    // Soft nudge only near end of trial
    return (
      <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
        <span className="font-semibold">Growth trial:</span>{" "}
        {daysLeft == null ? "active" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}.
        Full features unlocked.{" "}
        <Link
          href={`/billing/plan/${DEFAULT_PAID_PLAN_ID}`}
          className="font-semibold text-[#926efb] underline-offset-2 hover:underline"
        >
          Keep Growth for $9/mo
        </Link>
      </div>
    );
  }

  if (isVerified && status === "free_capped") {
    return (
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">You&apos;re on free forever (capped)</p>
        <p className="mt-1 text-amber-900/80">
          Your widget still works. Upgrade to Growth to remove branding, unlock
          domains, leaderboards, and advanced analytics.
        </p>
        <Link
          href={`/billing/plan/${DEFAULT_PAID_PLAN_ID}`}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
        >
          Upgrade to Growth — $9/mo
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    );
  }

  if (isVerified && isGrowth && status !== "trial") return null;

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
      label: status === "trial" && daysLeft != null && daysLeft <= 3 ? "Keep Growth" : "Explore Growth",
      done: status === "paid",
      href: `/billing/plan/${DEFAULT_PAID_PLAN_ID}`,
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
    <div className="group relative mb-5 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50/60 p-[1px] shadow-sm">
      <div className="relative rounded-2xl bg-white/70 px-4 py-4 backdrop-blur-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30">
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
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-700 ease-out"
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
                    s.done ? "text-emerald-700 line-through decoration-emerald-400" : "text-amber-950"
                  }`}
                >
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{s.hint}</p>
                {s.href && !s.done && (
                  <Link
                    href={s.href}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:gap-1.5 hover:text-rose-700"
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

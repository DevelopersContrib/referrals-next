"use client";

import Link from "next/link";
import { CheckCircle2Icon, RocketIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";

type Props = {
  isVerified: boolean;
  isPaid: boolean;
};

export function PaidOnboardingBanner({ isVerified, isPaid }: Props) {
  if (isVerified && isPaid) return null;

  const steps = [
    {
      id: "verify",
      label: "Verify your email",
      done: isVerified,
      href: null as string | null,
      cta: null as string | null,
      hint: "Use the link we sent so your account is active.",
    },
    {
      id: "billing",
      label: "Choose a plan",
      done: isPaid,
      href: "/billing",
      cta: "Go to Billing",
      hint: "Subscribe to publish referral programs and add extra brands.",
    },
  ];

  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="group relative mb-5 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50/60 p-[1px] shadow-sm">
      {/* animated sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-16 h-32 rotate-6 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-2xl motion-safe:animate-pulse"
      />
      <div className="relative rounded-2xl bg-white/70 px-4 py-4 backdrop-blur-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30">
              <RocketIcon className="size-5" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-950">
                Finish setup
                <SparklesIcon className="size-3.5 text-amber-500" />
              </p>
              <p className="text-xs text-amber-900/70">
                Unlock publishing and multi-brand workspaces.
              </p>
            </div>
          </div>

          {/* progress ring-ish pill */}
          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-amber-200/80">
            <span className="text-xs font-semibold text-amber-950">
              {completed}/{total} done
            </span>
            <span className="text-[11px] font-bold text-rose-500">{pct}%</span>
          </div>
        </div>

        {/* progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* step cards */}
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

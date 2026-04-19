"use client";

import Link from "next/link";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

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
      hint: "Use the link we sent so your account is active.",
    },
    {
      id: "billing",
      label: "Choose a plan in Billing",
      done: isPaid,
      href: "/billing",
      hint: "Subscribe to publish referral programs and add extra brands.",
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-white px-4 py-3 shadow-sm sm:px-5">
      <p className="text-sm font-semibold text-amber-950">Finish setup</p>
      <p className="mt-0.5 text-xs text-amber-900/80">
        Complete these steps to unlock publishing and multi-brand workspaces.
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((s) => (
          <li key={s.id} className="flex gap-2 text-sm">
            {s.done ? (
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <CircleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            )}
            <div className="min-w-0">
              {s.href && !s.done ? (
                <Link
                  href={s.href}
                  className="font-medium text-amber-950 underline decoration-amber-400/70 underline-offset-2 hover:decoration-amber-700"
                >
                  {s.label}
                </Link>
              ) : (
                <span className={s.done ? "text-slate-600 line-through" : "font-medium text-amber-950"}>
                  {s.label}
                </span>
              )}
              <p className="text-xs text-slate-600">{s.hint}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

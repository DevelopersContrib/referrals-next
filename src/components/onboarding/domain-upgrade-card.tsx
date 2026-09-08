"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PAID_PLAN_ID,
  FREE_PARTICIPANT_CAP,
} from "@/lib/billing-constants";

type PlanSummary = {
  id: number;
  name: string | null;
  price: number | null;
  unit: string | null;
  days: number | null;
  no_of_domains: number | null;
  campaigns_participants: number | null;
};

const FALLBACK_PLAN: PlanSummary = {
  id: DEFAULT_PAID_PLAN_ID,
  name: "Growth",
  price: 9,
  unit: "month",
  days: 30,
  no_of_domains: 1,
  campaigns_participants: null,
};

function buildIncludes(plan: PlanSummary): string[] {
  return [
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
}

type DomainUpgradeCardProps = {
  href: string;
};

export function DomainUpgradeCard({ href }: DomainUpgradeCardProps) {
  const [plan, setPlan] = useState<PlanSummary>(FALLBACK_PLAN);

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      try {
        const res = await fetch(
          `/api/billing/plans?planId=${DEFAULT_PAID_PLAN_ID}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { plan?: PlanSummary };
        if (!cancelled && data.plan) {
          setPlan(data.plan);
        }
      } catch {
        /* keep fallback */
      }
    }
    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const includes = useMemo(() => buildIncludes(plan), [plan]);
  const price = Number(plan.price ?? 0);
  const unit = plan.unit || "month";
  const days = plan.days || 30;
  const planName = plan.name || "Growth";

  return (
    <div className="mt-6 w-full max-w-md animate-in fade-in">
      <p className="mb-3 text-sm font-medium text-gray-600">
        Free accounts include 1 domain. Upgrade to Growth to analyze another.
      </p>
      <div className="relative flex w-full min-w-0 flex-col rounded-2xl border border-violet-200/80 bg-white p-5 shadow-xl shadow-violet-200/40 ring-2 ring-[#926efb]/25 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
          Growth plan
        </span>

        <div className="mb-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-rose-50/20 p-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            {planName}
          </h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              ${price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">/{unit} · per brand</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {days}-day billing cycle. Cancel anytime — your widget keeps running
            on free forever (capped) if you stop.
          </p>
        </div>

        <ul className="flex-1 space-y-3">
          {includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm text-gray-700"
            >
              <CheckIcon color="#926efb" />
              {item}
            </li>
          ))}
        </ul>

        <Link href={href} className="mt-6 block">
          <Button className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#926efb] to-[#7c3aed] text-sm font-semibold text-white shadow-md shadow-violet-300/40 hover:brightness-105">
            Upgrade to add this domain
          </Button>
        </Link>
      </div>
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

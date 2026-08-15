"use client";

import { useState } from "react";
import { fmtMoney } from "@/lib/admin-format";

export function RoiCalculator() {
  const [customers, setCustomers] = useState(500);
  const [aov, setAov] = useState(60);
  const [shareRate, setShareRate] = useState(25); // % who share
  const [convRate, setConvRate] = useState(15); // % of invited who convert
  const [invitesPer, setInvitesPer] = useState(3);

  const sharers = customers * (shareRate / 100);
  const invited = sharers * invitesPer;
  const newCustomers = Math.round(invited * (convRate / 100));
  const newRevenue = newCustomers * aov;
  const domainsNeeded = 1;
  const cost = 0; // Growth trial is free; capped free forever after
  const roi = cost > 0 ? Math.round((newRevenue / cost) * 100) : null;

  const inputs: {
    label: string;
    value: number;
    set: (n: number) => void;
    min: number;
    max: number;
    step: number;
    suffix?: string;
    prefix?: string;
  }[] = [
    { label: "Monthly customers", value: customers, set: setCustomers, min: 50, max: 10000, step: 50 },
    { label: "Average order value", value: aov, set: setAov, min: 5, max: 1000, step: 5, prefix: "$" },
    { label: "% who share", value: shareRate, set: setShareRate, min: 1, max: 100, step: 1, suffix: "%" },
    { label: "Invites per sharer", value: invitesPer, set: setInvitesPer, min: 1, max: 20, step: 1 },
    { label: "Invite conversion", value: convRate, set: setConvRate, min: 1, max: 100, step: 1, suffix: "%" },
  ];

  return (
    <div className="grid gap-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/40 sm:p-8 lg:grid-cols-2">
      <div className="space-y-5">
        {inputs.map((input) => (
          <div key={input.label}>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {input.label}
              </label>
              <span className="text-sm font-semibold text-gray-900">
                {input.prefix}
                {input.value.toLocaleString("en-US")}
                {input.suffix}
              </span>
            </div>
            <input
              type="range"
              min={input.min}
              max={input.max}
              step={input.step}
              value={input.value}
              onChange={(e) => input.set(Number(e.target.value))}
              className="w-full accent-[#FF5C62]"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-[#FF5C62] to-[#926efb] p-6 text-white sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-white/80">
          Estimated new revenue / month
        </p>
        <p className="mt-2 text-4xl font-bold sm:text-5xl">{fmtMoney(newRevenue)}</p>
        <div className="mt-6 space-y-2 text-sm text-white/90">
          <div className="flex justify-between border-b border-white/20 pb-2">
            <span>New referred customers</span>
            <span className="font-semibold">{newCustomers.toLocaleString("en-US")}/mo</span>
          </div>
          <div className="flex justify-between border-b border-white/20 pb-2">
            <span>Domains needed</span>
            <span className="font-semibold">{domainsNeeded}</span>
          </div>
          <div className="flex justify-between">
            <span>Your cost</span>
            <span className="font-semibold">$0 during Growth trial</span>
          </div>
        </div>
        <p className="mt-6 text-xs text-white/75">
          {roi !== null
            ? `That's roughly ${roi.toLocaleString("en-US")}% ROI.`
            : "14-day Growth trial is free — then stay free forever (capped) or $9/mo per brand."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { SparklesIcon } from "lucide-react";

/**
 * "What could this bring you?" — the owner plays with their own numbers and
 * sees the estimated payoff next to the $9. Always labelled as an estimate
 * built from their inputs; no invented benchmarks.
 */

type Field = {
  key: "customers" | "sharePct" | "invites" | "convPct" | "value";
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

const FIELDS: Field[] = [
  { key: "customers", label: "Customers you get a month", min: 10, max: 2000, step: 10, format: (v) => v.toLocaleString() },
  { key: "sharePct", label: "Share their link", min: 5, max: 60, step: 5, format: (v) => `${v}%` },
  { key: "invites", label: "Friends each one invites", min: 1, max: 10, step: 1, format: (v) => `${v}` },
  { key: "convPct", label: "Friends who become customers", min: 5, max: 50, step: 5, format: (v) => `${v}%` },
  { key: "value", label: "What a customer is worth", min: 5, max: 1000, step: 5, format: (v) => `$${v.toLocaleString()}` },
];

const money = (n: number) =>
  `$${Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function PublishGainCalculator() {
  const id = useId();
  const [v, setV] = useState({ customers: 100, sharePct: 20, invites: 3, convPct: 10, value: 50 });

  const newCustomers = v.customers * (v.sharePct / 100) * v.invites * (v.convPct / 100);
  const revenue = newCustomers * v.value;
  const multiple = revenue / 9;

  const mood =
    multiple >= 50 ? "That's a no-brainer." : multiple >= 10 ? "Pays for itself many times over." : multiple >= 1 ? "Pays for itself." : "Try your real numbers.";

  return (
    <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-rose-50/60 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <SparklesIcon className="size-4 text-[#7c3aed]" aria-hidden="true" />
        What could this bring you? Slide in your numbers.
      </p>

      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`${id}-${f.key}`} className="text-xs text-gray-600">
                {f.label}
              </label>
              <span className="text-xs font-semibold tabular-nums text-gray-900">{f.format(v[f.key])}</span>
            </div>
            <input
              id={`${id}-${f.key}`}
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={v[f.key]}
              onChange={(e) => setV((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
              className="mt-1 w-full accent-[#d63a40]"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" aria-live="polite">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-gray-900">
            {newCustomers < 1 ? newCustomers.toFixed(1) : Math.round(newCustomers).toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500">new customers a month</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-2xl font-bold tabular-nums text-[#d63a40]">{money(revenue)}</p>
          <p className="text-[11px] text-gray-500">extra revenue a month</p>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-gray-700">
        <span className="font-semibold">
          {multiple >= 1 ? `About ${Math.round(multiple).toLocaleString()}× your $9.` : "Less than your $9 so far."}
        </span>{" "}
        {mood}
      </p>
      <p className="mt-1 text-center text-[11px] text-gray-400">
        An estimate from the numbers above, not a promise.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Building2,
  Globe,
  Share2,
  Brain,
  Megaphone,
  Check,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brands/brand-logo";
import type { ModuleName } from "@/lib/analysis/types";
import { ONBOARDING_MODULES } from "@/lib/analysis/types";
import type { AnalysisStatus, ModuleView } from "./analysis-types";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

const ICONS: Record<ModuleName, LucideIcon> = {
  vnoc: Building2,
  crawl: Globe,
  social: Share2,
  intelligence: Brain,
  campaigns: Megaphone,
};

const ORDER: ModuleName[] = [...ONBOARDING_MODULES];

const ROTATING = [
  "Reading your homepage…",
  "Understanding your products…",
  "Finding your audience…",
  "Discovering social profiles…",
  "Designing your referral program…",
];

function progressOf(modules: ModuleView[]): number {
  if (!modules.length) return 6;
  const done = modules.filter((m) => m.status === "done" || m.status === "failed").length;
  const running = modules.some((m) => m.status === "running" || m.status === "queued") ? 0.5 : 0;
  return Math.min(100, Math.round(((done + running) / modules.length) * 100));
}

export function AnalysisPipeline({
  status,
  url,
}: {
  status: AnalysisStatus | null;
  url: string;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2200);
    return () => clearInterval(t);
  }, []);

  const modules = status?.modules ?? [];
  const byName = new Map(modules.map((m) => [m.module, m]));
  const pct = progressOf(modules);
  const domain = status?.domain || url.replace(/^https?:\/\//, "");

  const name = status?.vnoc?.name || status?.crawl?.name || null;
  const logo = status?.vnoc?.logoUrl || status?.crawl?.logoUrl || null;
  const favicon = status?.crawl?.faviconUrl || null;
  const colors = status?.crawl?.colors ?? [];
  const industry = status?.intelligence?.industry || null;
  const socials = status?.socials ?? [];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center px-4 py-10">
      <Image src={LOGO_URL} alt="Referrals.com" width={128} height={40} priority unoptimized className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* Left — live pipeline */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF5C62] opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FF5C62]" />
            </span>
            <p className="text-sm font-medium text-gray-500">
              Analyzing <span className="font-semibold text-gray-900">{domain}</span>
            </p>
          </div>

          <h2
            aria-live="polite"
            className="mt-3 bg-gradient-to-r from-[#FF5C62] via-[#ff7a54] to-[#926efb] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            {ROTATING[tick % ROTATING.length]}
          </h2>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF5C62] to-[#926efb] transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-xs font-medium text-gray-400">{pct}%</p>
          </div>

          {/* Checklist */}
          <ul className="mt-4 space-y-2">
            {ORDER.map((m, i) => {
              const row = byName.get(m);
              const st = row?.status || "pending";
              const Icon = ICONS[m];
              const label =
                st === "done"
                  ? row?.labels.done
                  : st === "running" || st === "queued"
                    ? row?.labels.active
                    : st === "failed"
                      ? "Skipped — using what we found"
                      : row?.labels.title;

              const active = st === "running" || st === "queued";
              return (
                <li
                  key={m}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${
                    active
                      ? "border-[#FF5C62]/30 bg-[#FF5C62]/5 shadow-sm"
                      : st === "done"
                        ? "border-emerald-100 bg-emerald-50/50"
                        : st === "failed"
                          ? "border-amber-100 bg-amber-50/50"
                          : "border-gray-100 bg-white"
                  }`}
                >
                  <span
                    className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? "bg-[#FF5C62]/15 text-[#FF5C62]"
                        : st === "done"
                          ? "bg-emerald-100 text-emerald-600"
                          : st === "failed"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {st === "done" ? (
                      <Check className="h-4 w-4 animate-in zoom-in duration-300" />
                    ) : st === "failed" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />
                    )}
                    {active && (
                      <span className="absolute inset-0 rounded-lg ring-2 ring-[#FF5C62]/40 animate-ping motion-reduce:hidden" />
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      active
                        ? "text-gray-900"
                        : st === "done"
                          ? "text-emerald-800"
                          : st === "failed"
                            ? "text-amber-800"
                            : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right — streaming brand reveal */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-100/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              What we&apos;re finding
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5">
                <BrandLogo
                  domain={domain}
                  logoUrl={logo}
                  faviconUrl={favicon}
                  imgClassName="h-full w-full object-contain animate-in fade-in zoom-in duration-500"
                  fallbackClassName="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-400"
                />
              </div>
              <div className="min-w-0">
                {name ? (
                  <p className="truncate text-lg font-bold text-gray-900 animate-in fade-in slide-in-from-bottom-1">
                    {name}
                  </p>
                ) : (
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                )}
                {industry ? (
                  <p className="text-sm text-gray-500 animate-in fade-in">{industry}</p>
                ) : (
                  <div className="mt-1.5 h-3.5 w-20 animate-pulse rounded bg-gray-100" />
                )}
              </div>
            </div>

            {/* Colors */}
            <div className="mt-5">
              <p className="text-xs font-medium text-gray-400">Brand colors</p>
              <div className="mt-2 flex gap-2">
                {colors.length ? (
                  colors.slice(0, 5).map((c, i) => (
                    <span
                      key={`${c}-${i}`}
                      title={c}
                      style={{ backgroundColor: c, animationDelay: `${i * 60}ms` }}
                      className="h-7 w-7 rounded-lg border border-black/5 shadow-sm animate-in zoom-in duration-300"
                    />
                  ))
                ) : (
                  [0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
                  ))
                )}
              </div>
            </div>

            {/* Socials */}
            <div className="mt-5">
              <p className="text-xs font-medium text-gray-400">Social profiles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {socials.length ? (
                  socials.map((s, i) => (
                    <span
                      key={s.platform}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium capitalize text-gray-700 animate-in fade-in zoom-in"
                    >
                      {s.platform}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-300">Searching…</span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            This usually takes about 15 seconds. Hang tight.
          </p>
        </div>
      </div>
    </div>
  );
}

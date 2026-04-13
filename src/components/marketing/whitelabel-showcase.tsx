/** Marketing mockups for /whitelabel — CSS-only motion (see globals.css). */

import type { ReactNode } from "react";

const iconDns = (
  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21V18m0 0a9.004 9.004 0 01-8.716-6.747M12 18V9m0 9c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18v-9m0-6v6" />
  </svg>
);
const iconSsl = (
  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const iconLive = (
  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function WhitelabelHeroMockup() {
  return (
    <div className="relative">
      <div className="animate-wl-glow pointer-events-none absolute -left-10 top-0 size-40 rounded-full bg-[#926efb]/35 blur-3xl" />
      <div className="animate-wl-glow pointer-events-none absolute -right-6 bottom-0 size-36 rounded-full bg-[#FF5C62]/25 blur-3xl [animation-delay:1s]" />
      <div className="relative overflow-hidden rounded-2xl border border-rose-100/90 bg-white shadow-2xl shadow-rose-200/30 ring-1 ring-black/5">
        <div className="relative flex items-center gap-2 overflow-hidden border-b border-gray-100 bg-gray-50/95 px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/90" />
            <span className="size-2.5 rounded-full bg-amber-400/90" />
            <span className="size-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <div className="relative ml-2 flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-lg border border-emerald-200/60 bg-white px-3 py-1.5">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="truncate font-mono text-[11px] font-medium text-gray-700">
              refer.<span className="text-[#926efb]">yourbrand</span>.com
            </span>
            <span className="ml-auto shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              TLS
            </span>
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-gray-50 to-white px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5">
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
            <div className="absolute inset-y-0 -left-1/2 w-[200%] bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.95)_50%,transparent_58%)] animate-wl-shimmer" />
          </div>

          <div className="relative mx-auto max-w-[260px] rounded-xl border border-gray-200/80 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-sm font-bold text-white shadow-md">
                YB
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Your program
                </p>
                <p className="truncate text-sm font-bold text-gray-900">Invite friends, earn rewards</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#FF5C62] to-[#926efb]" />
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-500">No “Powered by” — your brand only</p>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#242424] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
            >
              Share your link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  icon,
  label,
  sub,
  animClass,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  animClass: string;
}) {
  return (
    <div
      className={`relative flex min-w-[140px] flex-col items-center rounded-2xl border border-white/80 bg-white/90 px-5 py-4 text-center shadow-md backdrop-blur-sm sm:px-6 sm:py-5 ${animClass}`}
    >
      <div className="text-[#926efb]" aria-hidden>
        {icon}
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900">{label}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

function PipelineBetween() {
  return (
    <>
      <div className="hidden min-h-[4px] flex-1 items-center self-center px-1 sm:flex" aria-hidden>
        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200/90">
          <div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#FF5C62] to-[#926efb] animate-wl-line-grow" />
        </div>
      </div>
      <div className="flex flex-col items-center py-1 sm:hidden" aria-hidden>
        <svg className="size-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </>
  );
}

export function WhitelabelGoLivePipeline() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-rose-100/80 bg-gradient-to-br from-white via-violet-50/30 to-rose-50/40 p-8 shadow-xl ring-1 ring-black/5 sm:p-10">
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#926efb]/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#926efb]">
          Go live
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          From DNS to branded referrals in one flow
        </h2>
        <p className="mt-3 text-gray-600">
          Guided setup keeps your team unblocked — visitors only ever see your domain and
          creative.
        </p>
      </div>
      <div className="relative mx-auto mt-12 flex max-w-3xl flex-col items-center sm:flex-row sm:items-stretch sm:justify-center sm:gap-0">
        <PipelineStep
          icon={iconDns}
          label="DNS"
          sub="CNAME to edge"
          animClass="animate-wl-float w-full max-w-xs sm:max-w-[200px]"
        />
        <PipelineBetween />
        <PipelineStep
          icon={iconSsl}
          label="SSL"
          sub="Auto certificate"
          animClass="animate-wl-float-delayed w-full max-w-xs sm:max-w-[200px]"
        />
        <PipelineBetween />
        <PipelineStep
          icon={iconLive}
          label="Live"
          sub="Your domain"
          animClass="animate-wl-float-slow w-full max-w-xs sm:max-w-[200px]"
        />
      </div>
    </div>
  );
}

export function WhitelabelSurfacesMockup() {
  return (
    <div className="relative mx-auto max-w-4xl py-6">
      <p className="mb-10 text-center text-sm font-medium text-gray-500">
        Same brand system across every surface
      </p>
      <div className="relative flex min-h-[280px] items-center justify-center gap-4 sm:gap-8">
        {/* Phone */}
        <div className="animate-wl-float relative z-[2] w-[38%] max-w-[200px] sm:w-[200px]">
          <div className="rounded-[1.75rem] border-[10px] border-gray-900 bg-gray-900 p-1 shadow-2xl">
            <div className="overflow-hidden rounded-2xl bg-white">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#FF5C62]/90 to-[#926efb]/90 px-3 py-2">
                <span className="text-[9px] font-bold text-white">Your App</span>
                <span className="size-1.5 rounded-full bg-white/80" />
              </div>
              <div className="space-y-2 p-3">
                <div className="h-2 w-3/4 rounded bg-gray-100" />
                <div className="h-2 w-1/2 rounded bg-gray-100" />
                <div className="mt-3 rounded-lg bg-gradient-to-r from-rose-50 to-violet-50 p-2">
                  <div className="h-8 rounded bg-white/80 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Desktop */}
        <div className="animate-wl-float-delayed relative z-[1] w-[58%] max-w-[380px] sm:w-[380px]">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-red-400/80" />
                <span className="size-1.5 rounded-full bg-amber-400/80" />
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="ml-2 flex-1 rounded bg-white px-2 py-0.5 text-[8px] text-gray-500">
                refer.yourbrand.com/campaign/summer
              </div>
            </div>
            <div className="flex gap-2 bg-gradient-to-br from-gray-50 to-white p-3">
              <div className="hidden w-14 shrink-0 rounded border border-gray-100 bg-white sm:block" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-2 w-2/3 rounded bg-gray-200" />
                <div className="h-2 w-full rounded bg-gray-100" />
                <div className="h-2 w-5/6 rounded bg-gray-100" />
                <div className="mt-2 flex gap-2">
                  <span className="rounded-md bg-[#FF5C62] px-2 py-1 text-[9px] font-semibold text-white">
                    Join
                  </span>
                  <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[9px] text-gray-600">
                    Rules
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhitelabelEmailWidgetStrip() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="animate-wl-float-slow relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-wl-shimmer opacity-60" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Transactional email
        </p>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
          <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-xs font-bold text-white">
              YB
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">You earned a reward</p>
              <p className="text-xs text-gray-500">noreply@yourbrand.com</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Hi Alex — your referral hit the goal. Your code is inside your account. This
            message uses your logo, colors, and sending domain.
          </p>
          <span className="mt-4 inline-block rounded-lg bg-[#242424] px-4 py-2 text-xs font-semibold text-white">
            View reward
          </span>
        </div>
      </div>

      <div className="animate-wl-float-delayed relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
          Embeddable widget
        </p>
        <div className="mt-4 rounded-xl border border-violet-100/80 bg-white p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Share & win</span>
            <div className="flex gap-1">
              <span className="size-3 rounded-full bg-[#FF5C62]" />
              <span className="size-3 rounded-full bg-[#926efb]" />
              <span className="size-3 rounded-full bg-gray-200" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Your palette · your copy · your CTA</p>
          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3 text-center">
            <p className="font-mono text-[10px] text-gray-400">&lt;script src=&quot;cdn…/widget.js&quot;&gt;</p>
            <p className="mt-2 text-[11px] font-medium text-gray-600">One line on any site</p>
          </div>
        </div>
      </div>
    </div>
  );
}

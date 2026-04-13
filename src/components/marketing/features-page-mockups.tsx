import Link from "next/link";

const statPills = [
  { label: "Brands", value: "10", color: "bg-rose-100 text-rose-700" },
  { label: "Campaigns", value: "59", color: "bg-violet-100 text-violet-700" },
  { label: "Impressions", value: "8.6M", color: "bg-amber-100 text-amber-800" },
  { label: "Referrals", value: "10.2k", color: "bg-emerald-100 text-emerald-800" },
  { label: "Shares", value: "5.8k", color: "bg-sky-100 text-sky-800" },
  { label: "Clicks", value: "15.5k", color: "bg-orange-100 text-orange-800" },
];

const brandCards = [
  { name: "PayNow", domain: "paynow.com", campaigns: 4 },
  { name: "AgentDAO", domain: "agentdao.io", campaigns: 12 },
  { name: "Zipsite", domain: "zipsite.com", campaigns: 7 },
];

/** Compact dashboard frame for hero side column */
export function FeaturesHeroDashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -right-8 -top-6 hidden h-32 w-32 rounded-full bg-[#FF5C62]/15 blur-2xl lg:block" />
      <div className="absolute -bottom-4 -left-4 hidden h-24 w-24 rounded-full bg-[#926efb]/20 blur-2xl lg:block" />
      <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-xl shadow-rose-200/40 ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-red-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 truncate text-[10px] text-gray-500">
            app.referrals.com/dashboard
          </span>
        </div>
        <div className="bg-gradient-to-r from-[#FF5C62] to-[#ff7a6f] px-4 py-4 text-white">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">
            Overview
          </p>
          <p className="text-lg font-bold leading-tight">Dashboard</p>
          <p className="mt-1 text-xs text-white/85">
            Your referral program at a glance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {statPills.slice(0, 6).map((s) => (
            <div
              key={s.label}
              className={`rounded-lg px-2 py-2 text-center ${s.color}`}
            >
              <p className="text-sm font-bold tabular-nums">{s.value}</p>
              <p className="text-[9px] font-medium opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 bg-gray-50/50 px-3 pb-3 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Your brands
          </p>
          <div className="mt-2 flex gap-2">
            {brandCards.map((b) => (
              <div
                key={b.name}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
              >
                <div className="h-6 rounded bg-gradient-to-br from-gray-200 to-gray-300" />
                <p className="mt-1 truncate text-[10px] font-semibold text-gray-800">
                  {b.name}
                </p>
                <p className="truncate text-[9px] text-gray-500">{b.domain}</p>
                <p className="mt-0.5 text-[9px] text-brand">{b.campaigns} campaigns</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-width richer dashboard preview below hero */
export function FeaturesDashboardShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-rose-100/80 bg-gradient-to-b from-white to-rose-50/40 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,92,98,0.12),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm">
            Live product preview
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            The referral dashboard your team will actually use
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            One place for brands, campaigns, performance, and growth — styled like
            the real app, because it is.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl shadow-rose-200/30 ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400/90" />
                <span className="size-2.5 rounded-full bg-amber-400/90" />
                <span className="size-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <span className="text-xs text-gray-500">referrals.com/dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="hidden sm:inline">Search</span>
              <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-400">
                ⌘K
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FF5C62] via-[#ff6b72] to-[#ff8a6b] px-4 py-8 text-white sm:px-8 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/85">Dashboard</p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  Welcome back — here&apos;s your referral overview
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                  Refer Us
                </span>
                <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#FF5C62] shadow-md">
                  + New Brand
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 bg-gray-50/80 p-4 sm:grid-cols-2 lg:grid-cols-6 sm:gap-4 sm:p-6">
            {statPills.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
              >
                <p className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${s.color}`}>
                  {s.label}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 border-t border-gray-100 bg-white p-4 sm:p-6 lg:grid-cols-[1fr_280px]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Your brands
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: "PayNow", plan: "Free Plan", date: "Mar 25" },
                  { name: "DNtrademark", plan: "Free Plan", date: "Mar 25" },
                  { name: "AgentDAO", plan: "Free Plan", date: "Mar 25" },
                  { name: "Zipsite", plan: "Free Plan", date: "Mar 25" },
                  { name: "ProfileSuite", plan: "Free Plan", date: "Mar 25" },
                  { name: "SlimSnacks", plan: "Free Plan", date: "Mar 25" },
                ].map((b) => (
                  <div
                    key={b.name}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-rose-200 hover:shadow-md"
                  >
                    <div className="h-20 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
                    <div className="p-3">
                      <p className="font-semibold text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.plan}</p>
                      <p className="mt-1 text-xs text-brand">{b.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-sm font-semibold text-gray-900">Upgrade your plan</p>
                <p className="mt-1 text-xs text-gray-600">
                  Analytics, branding, and priority support.
                </p>
                <Link
                  href="/pricing"
                  className="mt-3 inline-block rounded-lg bg-[#FF5C62] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ff4f58]"
                >
                  View plans
                </Link>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Quick links</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[11px] font-medium text-gray-700">
                  {["Blog", "Knowledge", "Support", "Forum"].map((x) => (
                    <span
                      key={x}
                      className="rounded-lg border border-gray-100 bg-gray-50 py-2 hover:border-rose-200"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Reward system: visual mockups for coupon / cash / token */
export function FeaturesRewardSystemMockup() {
  return (
    <div className="mb-10 grid gap-6 lg:grid-cols-3">
      <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-rose-300 bg-gradient-to-br from-rose-50 to-white p-6 shadow-md transition-transform hover:-translate-y-1">
        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-[#FF5C62]/10 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-wide text-rose-600">
          Coupon reward
        </p>
        <div className="mt-4 flex rotate-[-2deg] justify-center">
          <div className="relative w-full max-w-[220px] rounded-lg bg-gradient-to-r from-[#FF5C62] to-[#ff8a8f] px-4 py-6 text-center text-white shadow-lg">
            <p className="text-xs font-medium opacity-90">Referral unlocked</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-widest">SAVE20</p>
            <p className="mt-2 text-[10px] opacity-80">Auto-issued on goal complete</p>
            <div className="absolute left-0 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            <div className="absolute right-0 top-1/2 size-3 translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-600">
          Single-use & multi-use codes · expiry rules · inventory
        </p>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md transition-transform hover:-translate-y-1">
        <div className="absolute -left-4 bottom-0 size-20 rounded-full bg-emerald-200/40 blur-xl" />
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
          Cash reward
        </p>
        <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">PayPal payout</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">$25.00</p>
          <p className="mt-1 text-xs text-gray-500">Sent to referrer · ID #8F2A91</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 group-hover:w-full" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-600">
          PayPal & payout tracking built in
        </p>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-md transition-transform hover:-translate-y-1">
        <div className="absolute right-0 top-0 size-28 translate-x-1/4 -translate-y-1/4 rounded-full bg-violet-300/30 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
          Token reward
        </p>
        <div className="mt-4 flex flex-col items-center">
          <div className="relative flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl ring-4 ring-violet-200/50 transition-transform group-hover:scale-105">
            <svg className="size-14 opacity-95" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9L2 7v10l10 5 10-5V7l-10 5z" />
            </svg>
            <span className="absolute bottom-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              +120 REF
            </span>
          </div>
          <p className="mt-3 text-center text-xs text-gray-600">
            Web3-ready · contract metadata · delivery status
          </p>
        </div>
      </div>
    </div>
  );
}

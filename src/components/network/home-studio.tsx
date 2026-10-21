import Link from "next/link";
import { Confetti, ReferralChain, Stickers, Ticker } from "@/components/network/fun";
import { NetworkCta, NetworkFaq } from "@/components/network/network-chrome";
import { NetworkShowcase } from "@/components/network/network-showcase";
import type { NetworkSite } from "@/lib/network-sites";

/** Studio: dark and product-first. The showcase carries the hero. */
export function HomeStudio({ site }: { site: NetworkSite }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--net-ink)] text-white">
        {/* Party shapes behind the showcase. */}
        <span aria-hidden className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-[var(--net-accent)] opacity-60" />
        <span aria-hidden className="absolute bottom-10 right-[38%] hidden h-16 w-16 rounded-full bg-[#facc15] lg:block" />
        <svg aria-hidden viewBox="0 0 120 30" className="absolute left-[46%] top-16 hidden w-32 text-[#34d399] lg:block">
          <path d="M2 15 Q17 0 32 15 T62 15 T92 15 T118 15" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>

        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <p className="text-sm font-medium text-white/60">{site.hero.audience}</p>
            <h1 className="mt-4 text-[clamp(2.4rem,5.2vw,3.9rem)] font-bold leading-[1.03] tracking-[-0.025em]">
              {site.hero.headline}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-white/70">{site.hero.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <NetworkCta site={site} tone="light" />
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                See how it works
              </Link>
            </div>
            <Stickers items={site.stickers} tone="dark" className="mt-9" />
          </div>
          <figure className="relative">
            <Confetti site={site} />
            <div className="relative rotate-[1.5deg]">
              <NetworkShowcase showcase={site.showcase} />
            </div>
            <figcaption className="mt-4 text-sm text-white/50">{site.showcase.caption}</figcaption>
          </figure>
        </div>
      </section>

      <Ticker items={site.ticker} className="bg-[#facc15] text-[#1f1300]" />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <h2 className="text-center text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.02em]">
          {site.chain.title}
        </h2>
        <div className="mt-20">
          <ReferralChain site={site} />
        </div>
      </section>

      <section className="bg-[var(--net-tint)]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-24">
          <h2 className="text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.02em]">
            {site.tagline}
          </h2>
          <div>
            {site.benefits.map((b, i) => (
              <div key={b.title} className="flex gap-5 border-t border-[var(--net-ink)]/15 py-6 first:border-t-0 first:pt-0">
                <span
                  aria-hidden
                  className="mt-1 h-4 w-4 shrink-0 rounded-full"
                  style={{ background: ["#facc15", "#34d399", "#f472b6"][i % 3] }}
                />
                <div>
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-[var(--net-ink)]/70">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">How {site.name} works</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {site.steps.map((s, i) => (
            <li key={s.title} className="border-t-4 pt-5" style={{ borderColor: ["#facc15", "#34d399", "#f472b6", "#38bdf8"][i % 4] }}>
              <span className="text-sm font-semibold text-[var(--net-primary)]">Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--net-ink)]/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">Questions</h2>
        <div className="mt-6">
          <NetworkFaq site={site} columns={2} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--net-primary)] text-white">
        <span aria-hidden className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[#facc15] opacity-90" />
        <span aria-hidden className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[var(--net-accent)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-tight tracking-[-0.02em]">
              {site.closer}
            </p>
            <p className="mt-3 text-white/80">Set it up free. Pay $9 a month when a brand goes live.</p>
          </div>
          <NetworkCta site={site} tone="light" className="shrink-0" />
        </div>
      </section>
    </>
  );
}

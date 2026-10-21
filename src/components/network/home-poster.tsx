import Link from "next/link";
import { Confetti, Face, ReferralChain, Stickers, Ticker } from "@/components/network/fun";
import { NetworkCta, NetworkFaq } from "@/components/network/network-chrome";
import { NetworkShowcase } from "@/components/network/network-showcase";
import { POSTER_DISPLAY as DISPLAY } from "@/components/network/network-design";
import type { NetworkSite } from "@/lib/network-sites";

/** Poster: bold condensed type on a solid block of the clone's color. */
export function HomePoster({ site }: { site: NetworkSite }) {
  return (
    <>
      <section className="grid lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden bg-[var(--net-primary)] px-4 py-14 text-white sm:px-10 lg:px-14 lg:py-24">
          <Confetti site={site} count={22} />
          <span aria-hidden className="absolute -bottom-10 -right-8 rotate-[-10deg] opacity-95">
            <Face color="#facc15" variant={0} size={170} />
          </span>
          <p className="relative text-base font-medium text-white/80">{site.hero.audience}</p>
          <h1 className={`relative mt-6 text-[clamp(3rem,8.5vw,6.75rem)] ${DISPLAY}`}>{site.hero.headline}</h1>
          <Stickers items={site.stickers} tone="dark" className="relative mt-10 max-w-md" />
        </div>
        <div className="flex flex-col justify-center gap-8 px-4 py-12 sm:px-10 lg:px-12">
          <p className="max-w-[32rem] text-lg leading-relaxed text-[var(--net-ink)]/80">{site.hero.sub}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <NetworkCta site={site} tone="ink" />
            <Link href="/pricing" className="font-semibold underline decoration-2 underline-offset-4">
              See pricing
            </Link>
          </div>
          <figure className="rotate-[-1deg]">
            <NetworkShowcase showcase={site.showcase} />
            <figcaption className="mt-3 text-sm text-[var(--net-ink)]/60">{site.showcase.caption}</figcaption>
          </figure>
        </div>
      </section>

      <Ticker items={site.ticker} className={`bg-[var(--net-ink)] !py-5 !text-2xl text-[#facc15] ${DISPLAY}`} />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className={`text-center text-[clamp(2.25rem,5vw,3.75rem)] ${DISPLAY}`}>{site.chain.title}</h2>
        <div className="mt-20">
          <ReferralChain site={site} />
        </div>
      </section>

      <section className="border-y-2 border-[var(--net-ink)]">
        <ol className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-cols-4">
          {site.steps.map((s, i) => (
            <li
              key={s.title}
              className="border-[var(--net-ink)] px-4 py-10 sm:px-8 sm:[&:nth-child(odd)]:border-r-2 lg:border-r-2 lg:last:border-r-0"
            >
              <span
                aria-hidden
                className={`block text-[5.5rem] text-transparent ${DISPLAY}`}
                style={{ WebkitTextStroke: `2px ${["#f59e0b", "#10b981", "#ec4899", "#0ea5e9"][i % 4]}` }}
              >
                {i + 1}
              </span>
              <h2 className="mt-4 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--net-ink)]/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[var(--net-ink)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          {site.benefits.map((b, i) => (
            <div
              key={b.title}
              className="grid gap-4 border-b border-white/15 py-10 first:pt-0 last:border-0 last:pb-0 md:grid-cols-[1fr_1.1fr] md:gap-12"
            >
              <h2
                className={`text-[clamp(2rem,4.5vw,3.25rem)] ${DISPLAY}`}
                style={{ color: ["#facc15", "#34d399", "#f472b6"][i % 3] }}
              >
                {b.title}
              </h2>
              <p className="max-w-prose self-end text-lg leading-relaxed text-white/75">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className={`text-[clamp(2.25rem,5vw,3.5rem)] ${DISPLAY}`}>Questions</h2>
        <div className="mt-6">
          <NetworkFaq site={site} columns={2} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[var(--net-primary)] text-white">
        <span aria-hidden className="absolute -right-6 -top-8 rotate-[14deg]">
          <Face color="#34d399" variant={3} size={150} />
        </span>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <p className={`max-w-[16ch] text-[clamp(2.5rem,6vw,4.75rem)] ${DISPLAY}`}>{site.closer}</p>
          <NetworkCta site={site} tone="light" className="shrink-0" />
        </div>
      </section>
    </>
  );
}

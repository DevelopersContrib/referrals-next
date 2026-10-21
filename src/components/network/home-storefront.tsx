import Link from "next/link";
import { Confetti, Face, ReferralChain, Stickers, Ticker } from "@/components/network/fun";
import { NetworkCta, NetworkFaq } from "@/components/network/network-chrome";
import { NetworkShowcase } from "@/components/network/network-showcase";
import type { NetworkSite } from "@/lib/network-sites";

/** Storefront: warm and friendly. The showcase sits in a website window. */
export function HomeStorefront({ site }: { site: NetworkSite }) {
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--net-tint)]">
        {/* Friendly faces peeking in from the edges. */}
        <span aria-hidden className="absolute -left-6 top-28 hidden rotate-[-12deg] lg:block">
          <Face color="#facc15" variant={1} size={110} />
        </span>
        <span aria-hidden className="absolute -right-4 top-52 hidden rotate-[10deg] lg:block">
          <Face color="#34d399" variant={0} size={96} />
        </span>
        <span aria-hidden className="absolute left-[14%] top-14 hidden h-5 w-5 rounded-full bg-[#f472b6] lg:block" />
        <span aria-hidden className="absolute right-[18%] top-24 hidden h-3 w-3 rounded-full bg-[#38bdf8] lg:block" />

        <div className="relative mx-auto max-w-5xl px-4 pb-0 pt-14 text-center sm:px-6 sm:pt-20">
          <p className="text-base font-medium text-[var(--net-primary)]">{site.hero.audience}</p>
          <h1 className="mx-auto mt-4 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
            {site.hero.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-[38rem] text-lg leading-relaxed text-[var(--net-ink)]/75">
            {site.hero.sub}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <NetworkCta site={site} className="!rounded-full !px-8 !py-4 text-lg" />
            <Link href="/how-it-works" className="font-semibold underline decoration-2 underline-offset-4">
              How it works
            </Link>
          </div>
          <Stickers items={site.stickers} className="mt-8 justify-center" />
          <figure className="relative mx-auto mt-14 max-w-3xl translate-y-16 sm:translate-y-20">
            <Confetti site={site} />
            <div className="relative">
              <NetworkShowcase showcase={site.showcase} framed />
            </div>
            <figcaption className="mt-4 text-sm text-[var(--net-ink)]/60">{site.showcase.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-36 sm:px-6 sm:pt-44">
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">{site.chain.title}</h2>
        <div className="mt-20">
          <ReferralChain site={site} />
        </div>
      </section>

      <Ticker items={site.ticker} className="rotate-[-1.5deg] scale-105 bg-[var(--net-primary)] text-white" />

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {site.benefits.map((b, i) => (
            <div
              key={b.title}
              className="rounded-[var(--net-radius)] p-7"
              style={{ background: ["#fef3c7", "#d1fae5", "#fce7f3"][i % 3] }}
            >
              <h2 className="text-xl font-bold leading-snug">{b.title}</h2>
              <p className="mt-3 leading-relaxed text-[var(--net-ink)]/75">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-[calc(var(--net-radius)*1.5)] bg-[var(--net-tint)] px-6 py-12 sm:px-12">
          <h2 className="text-center text-3xl font-extrabold tracking-[-0.02em]">Live in four steps</h2>
          <ol className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden
              className="absolute left-[12%] right-[12%] top-6 hidden border-t-2 border-dashed border-[var(--net-primary)]/40 lg:block"
            />
            {site.steps.map((s, i) => (
              <li key={s.title} className="relative text-center">
                <span
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-[#1b1530] ring-8 ring-[var(--net-tint)]"
                  style={{ background: ["#facc15", "#34d399", "#f472b6", "#38bdf8"][i % 4] }}
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--net-ink)]/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-[-0.02em]">Good questions</h2>
        <div className="mt-4">
          <NetworkFaq site={site} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[calc(var(--net-radius)*1.5)] bg-[var(--net-primary)] px-6 py-16 text-center text-white sm:px-12">
          <span aria-hidden className="absolute -left-6 -top-6 hidden rotate-[-14deg] sm:block">
            <Face color="#facc15" variant={2} size={110} />
          </span>
          <span aria-hidden className="absolute -bottom-8 -right-4 hidden rotate-[12deg] sm:block">
            <Face color="#f472b6" variant={3} size={120} />
          </span>
          <p className="relative mx-auto max-w-[20ch] text-[clamp(1.8rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
            {site.closer}
          </p>
          <p className="relative mt-3 text-white/85">Set it up free. Pay $9 a month when you go live.</p>
          <NetworkCta site={site} tone="light" className="relative mt-8 !rounded-full !px-8 !py-4 text-lg" />
        </div>
      </section>
    </>
  );
}

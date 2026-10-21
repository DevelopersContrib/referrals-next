import Link from "next/link";
import { ReferralChain } from "@/components/network/fun";
import { NetworkCta, NetworkFaq } from "@/components/network/network-chrome";
import { PRO_SERIF } from "@/components/network/network-design";
import { NetworkShowcase } from "@/components/network/network-showcase";
import type { NetworkSite } from "@/lib/network-sites";

/** True of every clone: they all sell the same Referrals.com plans. */
const FACTS = [
  { value: "$9 a month", label: "per published brand, or $99 a year" },
  { value: "No fees", label: "per referral or per signup" },
  { value: "One snippet", label: "to add the widget to any site" },
  { value: "10 or 50", label: "brands on one agency plan" },
];

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-[var(--net-primary)]" aria-hidden>
      <path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Professional: calm and polished for business buyers. Serif headlines, quiet motion. */
export function HomeProfessional({ site }: { site: NetworkSite }) {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-24">
          <div>
            <p className="text-sm font-medium text-[var(--net-primary)]">{site.hero.audience}</p>
            <h1 className={`mt-4 text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.06] ${PRO_SERIF}`}>
              {site.hero.headline}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-slate-600">{site.hero.sub}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <NetworkCta site={site} />
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-[var(--net-radius)] border border-slate-300 px-6 py-3.5 font-semibold text-[var(--net-ink)] hover:border-slate-400 hover:bg-slate-50"
              >
                See pricing
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {site.stickers.map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <Check />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <figure>
            <div className="rounded-[calc(var(--net-radius)*1.75)] bg-slate-100 p-3 ring-1 ring-black/5 sm:p-5">
              <NetworkShowcase showcase={site.showcase} />
            </div>
            <figcaption className="mt-3 text-sm text-slate-500">{site.showcase.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y border-black/10 bg-slate-50">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-black/10 px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
          {FACTS.map((f) => (
            <div key={f.value} className="py-8 lg:px-8 lg:first:pl-0">
              <dt className={`text-2xl text-[var(--net-ink)] ${PRO_SERIF}`}>{f.value}</dt>
              <dd className="mt-1 text-sm text-slate-600">{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <h2 className={`text-[clamp(1.9rem,3.4vw,2.6rem)] leading-tight ${PRO_SERIF}`}>{site.chain.title}</h2>
          <p className="mt-3 text-lg text-slate-600">
            Each person who joins gets their own link, so one share keeps paying off.
          </p>
        </div>
        <div className="mt-20">
          <ReferralChain site={site} plain />
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <h2 className={`max-w-2xl text-[clamp(1.9rem,3.4vw,2.6rem)] leading-tight ${PRO_SERIF}`}>{site.tagline}</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {site.benefits.map((b) => (
              <div key={b.title} className="border-t-2 border-[var(--net-primary)] pt-6">
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <h2 className={`text-[clamp(1.9rem,3.4vw,2.6rem)] leading-tight ${PRO_SERIF}`}>How {site.name} works</h2>
        <ol className="relative mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-px bg-slate-300 lg:block" />
          {site.steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white font-semibold text-[var(--net-primary)]">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className={`text-[clamp(1.9rem,3.4vw,2.6rem)] leading-tight ${PRO_SERIF}`}>Questions</h2>
            <p className="mt-3 text-slate-600">
              Anything else? Our support team is on Referrals.com.
            </p>
          </div>
          <NetworkFaq site={site} />
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-[calc(var(--net-radius)*1.5)] bg-[var(--net-ink)] px-8 py-14 text-white md:flex-row md:items-center md:px-12">
          <div>
            <p className={`max-w-[26ch] text-[clamp(1.7rem,3vw,2.3rem)] leading-tight ${PRO_SERIF}`}>{site.closer}</p>
            <p className="mt-3 text-white/70">Set up free. Pay $9 a month when a brand goes live.</p>
          </div>
          <NetworkCta site={site} tone="light" className="shrink-0" />
        </div>
      </section>
    </>
  );
}

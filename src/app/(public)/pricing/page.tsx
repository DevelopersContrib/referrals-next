import { Metadata } from "next";
import Link from "next/link";
import { PricingHeroMockup } from "@/components/marketing/pricing-hero-mockup";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Pricing — Free to start, $9/mo per extra domain | Referrals.com",
  description:
    "Your first referral campaign is free with every feature included. Add another domain for just $9/month. No tiers, no feature gates, no annual lock-in.",
  alternates: { canonical: "https://referrals.com/pricing" },
  openGraph: {
    title: "Pricing — Free to start, $9/mo per extra domain | Referrals.com",
    description:
      "Your first referral campaign is free with every feature included. Add another domain for just $9/month.",
    url: "https://referrals.com/pricing",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing — Free to start, $9/mo per extra domain | Referrals.com",
    description:
      "Your first referral campaign is free with every feature included. Add another domain for just $9/month.",
  },
};

const includedFeatures = [
  "Unlimited campaigns on your domain",
  "Gamification & leaderboards",
  "Voting campaigns",
  "Advanced analytics",
  "All social sharing channels",
  "Custom reward rules",
  "Anti-fraud tracking",
  "Widget templates & embeds",
  "Email campaigns via SES",
  "API access",
  "Zapier & integrations",
  "GDPR compliance",
];

const faqs = [
  {
    q: "How much does Referrals.com cost?",
    a: "Your first campaign on your first domain is completely free — with every feature included. Each additional domain is $9/month. That's it: no tiers, no feature gates.",
  },
  {
    q: "What's actually free?",
    a: "Everything. Gamification, voting, analytics, widgets, anti-fraud, API access and integrations all work on the free domain. The only limit is the number of domains: one free, then $9/month each.",
  },
  {
    q: "How does the $9/month per domain work?",
    a: "Each domain you connect beyond your first is billed as its own $9/month subscription. Add or cancel domains anytime — cancelling a domain simply stops billing for that unit.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign up, launch your first campaign, and run it for free. You only enter payment details when you add a second domain.",
  },
  {
    q: "Is there an annual plan?",
    a: "No annual lock-in and no long-term contracts. Every domain is a simple month-to-month $9 subscription.",
  },
];

const pricingTestimonials = [
  {
    name: "Alyssa Torres",
    role: "Growth Lead, VentureBuilder",
    quote:
      "We launched in one afternoon and referrals became our highest-converting channel in under two weeks.",
    initials: "AT",
  },
  {
    name: "Noah Kim",
    role: "Founder, ContentAgent",
    quote:
      "$9 a domain is a no-brainer. Setup was simple and the analytics were exactly what we needed.",
    initials: "NK",
  },
  {
    name: "Sam Rivera",
    role: "CMO, Contrib",
    quote:
      "The campaign templates and automation saved our team hours every week while bringing consistent new users.",
    initials: "SR",
  },
];

const trustPills = [
  "No credit card to start",
  "Every feature included free",
  "Cancel any domain anytime",
];

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-white via-rose-50/50 to-orange-50/40">
      <JsonLd data={faqPageJsonLd(faqs)} />

      {/* Hero */}
      <section className="public-hero relative overflow-x-hidden lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-32 hidden h-80 w-80 rounded-full bg-[#926efb]/12 blur-3xl lg:block" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(0,400px)] lg:gap-12">
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm backdrop-blur">
                Simple, usage-based pricing
              </span>
              <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-gray-900 min-[380px]:text-[1.85rem] sm:mt-4 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Your first campaign is{" "}
                <span className="bg-gradient-to-r from-[#FF5C62] via-[#ff7a6f] to-[#926efb] bg-clip-text text-transparent">
                  free
                </span>
                . Add a domain for $9/mo.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 sm:mt-4 sm:text-base md:text-lg lg:mx-0">
                Every feature is included on every domain — gamification, voting,
                analytics, anti-fraud, the works. You only pay to grow to more
                domains.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5 lg:justify-start">
                {trustPills.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-rose-100/90 bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3 lg:justify-start">
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:bg-[#ff4f58]"
                >
                  Start free
                </Link>
                <Link
                  href="/features"
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  See all features
                </Link>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <PricingHeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards — Free vs $9/domain */}
      <section className="relative pb-6 pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-rose-100/90 bg-white p-8 shadow-md">
              <div className="mb-6 rounded-xl bg-gradient-to-br from-rose-500/10 to-orange-50/30 p-4">
                <h2 className="text-xl font-bold text-gray-900">Free</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                  <span className="text-gray-500">/forever</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  1 campaign on 1 domain — every feature included.
                </p>
              </div>
              <ul className="flex-1 space-y-3">
                {includedFeatures.slice(0, 6).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckIcon color="#FF5C62" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-[#FF5C62] px-6 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg"
              >
                Start free
              </Link>
            </div>

            {/* Growth — $9/domain */}
            <div className="relative flex flex-col rounded-2xl border border-violet-200/80 bg-white p-8 shadow-xl shadow-violet-200/40 ring-2 ring-[#926efb]/25">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
                Grow to more domains
              </span>
              <div className="mb-6 rounded-xl bg-gradient-to-br from-violet-500/10 to-rose-50/20 p-4">
                <h2 className="text-xl font-bold text-gray-900">Per additional domain</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$9</span>
                  <span className="text-gray-500">/month per domain</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Same full feature set — just add domains as you grow.
                </p>
              </div>
              <ul className="flex-1 space-y-3">
                <li className="flex items-start gap-3 text-sm font-medium text-gray-800">
                  <CheckIcon color="#926efb" />
                  Everything in Free, on every domain
                </li>
                {includedFeatures.slice(6).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckIcon color="#926efb" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-violet-300/40 transition-all hover:brightness-105 hover:shadow-lg"
              >
                Start free, add domains later
              </Link>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-gray-600">
            Running lots of domains?{" "}
            <Link href="/contact" className="font-semibold text-[#926efb] hover:underline">
              Talk to us
            </Link>{" "}
            about volume pricing.
          </p>
        </div>
      </section>

      {/* Everything included */}
      <section className="relative py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(146,110,251,0.08),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#926efb]">
              No feature gates
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Every feature, on every plan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              We don&apos;t hide features behind tiers. Free and paid domains get
              the exact same platform.
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {includedFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
              >
                <CheckIcon color="#FF5C62" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="border-y border-rose-100/60 bg-gradient-to-b from-white to-rose-50/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              See your referral upside
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Estimate the new revenue a referral program could drive — your first
              campaign is free, so it&apos;s all upside.
            </p>
          </div>
          <div className="mt-12">
            <RoiCalculator />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-b from-white to-rose-50/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-3 text-gray-600">
              Straightforward answers about our free-first, $9-per-domain pricing.
            </p>
          </div>
          <dl className="mt-12 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <dt className="font-semibold text-gray-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-white via-violet-50/20 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Loved by growth teams
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Teams scale referrals faster when every feature is on from day one.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricingTestimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-rose-100/80 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-4 flex gap-0.5 text-amber-400" aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#ff646c] to-[#926efb] text-sm font-bold text-white shadow-md">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#ff646c] via-[#ff5c62] to-[#926efb] py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay">
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Launch your first campaign free
          </h2>
          <p className="mt-4 text-lg text-white/90">
            No credit card. Every feature included. Add domains for $9/mo when you
            grow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
            >
              Start free
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-xl border-2 border-white/40 bg-white/10 px-8 py-3.5 text-lg font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      className="mt-0.5 h-5 w-5 flex-shrink-0"
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

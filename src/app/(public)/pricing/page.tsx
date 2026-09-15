import { Metadata } from "next";
import Link from "next/link";
import { PricingHeroMockup } from "@/components/marketing/pricing-hero-mockup";
import { PublicPlanCatalog } from "@/components/marketing/public-plan-catalog";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { auth } from "@/lib/auth";
import { PLAN_CATALOG_COPY, type CatalogPlan } from "@/lib/plan-catalog";
import { prisma } from "@/lib/prisma";
import { faqPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Pricing — 14-day Growth trial, then $9/mo per brand | Referrals.com",
  description:
    "Start with 14 days of full Growth features — no credit card. Then keep Growth for $9/month per brand. VNOC / network domains stay free.",
  alternates: { canonical: "https://referrals.com/pricing" },
  openGraph: {
    title:
      "Pricing — 14-day Growth trial, then $9/mo per brand | Referrals.com",
    description:
      "Same plans as in-app billing: Individuals, Partners, annual ~$/mo. 14-day Growth trial, then pay per brand.",
    url: "https://referrals.com/pricing",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title:
      "Pricing — 14-day Growth trial, then $9/mo per brand | Referrals.com",
    description:
      "14-day Growth trial, then $9/month per brand. VNOC / network domains stay free.",
  },
};

const faqs = [
  {
    q: "How much does Referrals.com cost?",
    a: "You get 14 days of full Growth with no credit card. After that, external brands need a paid plan (from $9/mo per brand). VNOC / network domains stay free.",
  },
  {
    q: "What happens after the 14-day trial?",
    a: PLAN_CATALOG_COPY.unpaidFootnote,
  },
  {
    q: "What's included in Growth?",
    a: "Full product per brand: multi-domain, leaderboards, advanced analytics, and no Referrals.com branding on your widgets.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Sign up, run the full Growth trial for 14 days, then choose a plan when you're ready.",
  },
  {
    q: "Is there an annual plan?",
    a: "Yes — annual plans show a ~$/mo equivalent on the cards below. Monthly plans are billed month-to-month.",
  },
  {
    q: "Are partner plans different?",
    a: "Partner & agency plans are multi-brand packages for resellers. They appear in a separate section below Individuals.",
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
      "$9 a brand is a no-brainer once the widget is live. Setup was simple and the analytics were exactly what we needed.",
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
  "14-day Growth trial",
  "No credit card",
  "Same plans as billing",
];

export default async function PricingPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  const plans = (await prisma.plans.findMany({
    orderBy: { id: "asc" },
  })) as CatalogPlan[];

  const primaryCtaHref = isLoggedIn ? "/billing" : "/signup";
  const primaryCtaLabel = isLoggedIn ? "Choose a plan" : "Start free trial";

  return (
    <div className="bg-gradient-to-b from-white via-rose-50/50 to-orange-50/40">
      <JsonLd data={faqPageJsonLd(faqs)} />

      <section className="public-hero relative overflow-x-hidden lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-32 hidden h-80 w-80 rounded-full bg-[#926efb]/12 blur-3xl lg:block" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(0,400px)] lg:gap-12">
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm backdrop-blur">
                14-day Growth trial · then $9/mo per brand
              </span>
              <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-gray-900 min-[380px]:text-[1.85rem] sm:mt-4 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Plans that match{" "}
                <span className="bg-gradient-to-r from-[#FF5C62] via-[#ff7a6f] to-[#926efb] bg-clip-text text-transparent">
                  your billing
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 sm:mt-4 sm:text-base md:text-lg lg:mx-0">
                Individuals and Partners — the same catalog you see after
                signup. Start with a Growth trial (no card). External brands
                then pay per brand; {PLAN_CATALOG_COPY.vnocFootnote}
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
                  href={primaryCtaHref}
                  className="rounded-xl bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:bg-[#ff4f58]"
                >
                  {primaryCtaLabel}
                </Link>
                <a
                  href="#plans"
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  Compare plans
                </a>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <PricingHeroMockup />
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="relative scroll-mt-24 pb-8 pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#926efb]">
              Available plans
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose the plan that fits
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              Most Popular marks the best starting Growth plan. Annual cards
              show a ~$/mo equivalent.
            </p>
          </div>
          <PublicPlanCatalog plans={plans} isLoggedIn={isLoggedIn} />
        </div>
      </section>

      <section className="border-y border-rose-100/60 bg-gradient-to-b from-white to-rose-50/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              See your referral upside
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Estimate the new revenue a referral program could drive — start
              with a free Growth trial.
            </p>
          </div>
          <div className="mt-12">
            <RoiCalculator />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-rose-50/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-3 text-gray-600">
              {PLAN_CATALOG_COPY.trialFootnote}
            </p>
          </div>
          <dl className="mt-12 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <dt className="font-semibold text-gray-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-gradient-to-b from-white via-violet-50/20 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Loved by growth teams
            </h2>
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
                    <p className="text-sm font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#ff646c] via-[#ff5c62] to-[#926efb] py-16 sm:py-20">
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Start your 14-day Growth trial
          </h2>
          <p className="mt-4 text-lg text-white/90">
            No credit card. Full product for 14 days — then pick a plan from the
            catalog above.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={primaryCtaHref}
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
            >
              {primaryCtaLabel}
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

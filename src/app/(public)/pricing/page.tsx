import { Metadata } from "next";
import Link from "next/link";
import { PricingHeroMockup } from "@/components/marketing/pricing-hero-mockup";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Affordable referral marketing plans for businesses of all sizes. Start free, upgrade as you grow.",
  openGraph: {
    title: "Pricing Plans | Referrals.com",
    description:
      "Affordable referral marketing plans for businesses of all sizes. Start free, upgrade as you grow.",
    url: "https://referrals.com/pricing",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing Plans | Referrals.com",
    description:
      "Affordable referral marketing plans for businesses of all sizes. Start free, upgrade as you grow.",
  },
};

const tiers = [
  {
    name: "Pioneer Plan",
    price: "$299",
    period: "/month",
    description: "For businesses ready to scale with unlimited referral power.",
    features: [
      "Unlimited Domains",
      "Unlimited Campaigns",
      "Unlimited Brands",
      "GDPR Compliant",
      "Priority Support",
      "Advanced Analytics",
      "Custom Widgets",
      "API Access",
      "Email Campaigns via SES",
      "Remove Branding",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    highlighted: false,
    accent: "#ff646c",
    accentSoft: "from-rose-500/10 to-orange-50/30",
  },
  {
    name: "Premium (Grow)",
    price: "$9",
    period: "/Brand",
    description: "Perfect for growing businesses focused on leads and sales.",
    features: [
      "Lead Generation",
      "Social Followers Growth",
      "Sales & Conversions",
      "Gamification Features",
      "Advanced Analytics",
      "Voting Campaigns",
      "Contest & Leaderboards",
      "Custom Reward Rules",
      "All Social Channels",
      "Priority Support",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    highlighted: true,
    accent: "#926efb",
    accentSoft: "from-violet-500/10 to-rose-50/20",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with advanced needs and dedicated support.",
    features: [
      "Everything in Premium",
      "Unlimited Participants",
      "White-label Solution",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
      "SSO / SAML",
      "Custom Contracts",
      "Onboarding Assistance",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
    highlighted: false,
    accent: "#ff646c",
    accentSoft: "from-slate-500/5 to-rose-50/20",
  },
];

const comparisonFeatures = [
  ["Brands", "Unlimited", "Per Brand", "Unlimited"],
  ["Campaigns", "Unlimited", "Unlimited", "Unlimited"],
  ["Participants", "10,000", "10,000", "Unlimited"],
  ["Widget Templates", "All", "All", "All + Custom"],
  ["Social Sharing", "All channels", "All channels", "All channels"],
  ["Email Campaigns", "Yes", "Yes", "Yes"],
  ["API Access", "Yes", "Yes", "Yes"],
  ["Gamification", "No", "Yes", "Yes"],
  ["White-label", "No", "No", "Yes"],
  ["Support", "Priority", "Priority", "Dedicated"],
  ["GDPR Compliance", "Yes", "Yes", "Yes"],
  ["Custom Domain", "Yes", "Yes", "Yes"],
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
      "The Premium plan paid for itself in the first month. Setup was simple and the analytics were exactly what we needed.",
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

const currentReferralSites = [
  {
    name: "Contrib",
    domain: "contrib.com",
    metric: "4,200+ monthly referral visits",
  },
  {
    name: "VentureBuilder",
    domain: "venturebuilder.ai",
    metric: "17.4% referral conversion rate",
  },
  {
    name: "ContentAgent",
    domain: "contentagent.io",
    metric: "2.8x faster customer acquisition",
  },
];

const trustPills = [
  "No credit card to explore",
  "Upgrade or downgrade anytime",
  "GDPR-ready infrastructure",
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes. You can explore the product and launch campaigns before committing. Start from signup and pick the plan that fits when you are ready to scale.",
  },
  {
    q: "What does “per brand” mean on Premium?",
    a: "Premium pricing scales with the number of brands you run. Each brand gets its own campaigns, widgets, and analytics — ideal for agencies and multi-product teams.",
  },
  {
    q: "Can we switch plans later?",
    a: "Absolutely. Move between Pioneer, Premium, and Enterprise as your referral volume and feature needs change. Our team can help with migration.",
  },
  {
    q: "Do you offer annual billing?",
    a: "For Premium and Enterprise we can discuss annual contracts and volume discounts. Contact sales for a tailored quote.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-white via-rose-50/50 to-orange-50/40">
      {/* Hero */}
      <section className="public-hero relative overflow-x-hidden lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-32 hidden h-80 w-80 rounded-full bg-[#926efb]/12 blur-3xl lg:block" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(0,400px)] lg:gap-12">
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm backdrop-blur">
                Transparent pricing
              </span>
              <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-gray-900 min-[380px]:text-[1.85rem] sm:mt-4 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Plans that{" "}
                <span className="bg-gradient-to-r from-[#FF5C62] via-[#ff7a6f] to-[#926efb] bg-clip-text text-transparent">
                  scale with your referrals
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 sm:mt-4 sm:text-base md:text-lg lg:mx-0">
                From first campaign to enterprise rollouts — clear limits, powerful
                features, and no surprise line items.
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
                  Start free trial
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  Talk to sales
                </Link>
                <Link
                  href="/features"
                  className="text-sm font-semibold text-[#926efb] underline-offset-4 hover:underline"
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

      {/* Pricing Cards */}
      <section className="relative pb-6 pt-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-10 text-center text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Tip:</span> Most teams in
            growth mode start on{" "}
            <span className="font-semibold text-[#926efb]">Premium</span> for
            gamification and per-brand economics.
          </p>
          <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? "z-[1] border-violet-200/80 shadow-xl shadow-violet-200/40 ring-2 ring-[#926efb]/25 lg:-translate-y-1 lg:scale-[1.02]"
                    : "border-rose-100/90 shadow-md hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg"
                }`}
              >
                {tier.highlighted ? (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
                      Most popular
                    </span>
                  </>
                ) : null}
                <div
                  className={`mb-6 rounded-xl bg-gradient-to-br p-4 ${tier.accentSoft}`}
                >
                  <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {tier.price}
                    </span>
                    {tier.period ? (
                      <span className="text-gray-500">{tier.period}</span>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{tier.description}</p>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0"
                        style={{ color: tier.accent }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={`mt-8 block rounded-xl px-6 py-3.5 text-center text-sm font-semibold text-white transition-all hover:shadow-lg ${
                    tier.highlighted
                      ? "bg-gradient-to-r from-[#926efb] to-[#7c3aed] shadow-md shadow-violet-300/40 hover:brightness-105"
                      : ""
                  }`}
                  style={
                    tier.highlighted
                      ? undefined
                      : { backgroundColor: tier.accent }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="relative py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(146,110,251,0.08),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#926efb]">
              Compare
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Feature comparison
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Same core platform — pick the tier that matches how you sell and support.
            </p>
          </div>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-rose-100/80 bg-white/90 shadow-xl shadow-rose-100/50 ring-1 ring-black/5 backdrop-blur-sm">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-rose-100 bg-gradient-to-r from-rose-50/50 via-violet-50/40 to-rose-50/50">
                  <th className="py-4 pl-5 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Feature
                  </th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                    Pioneer
                  </th>
                  <th className="relative px-2 py-4 text-center text-xs font-bold uppercase tracking-wide text-[#926efb]">
                    <span className="relative z-[1]">Premium</span>
                    <span
                      className="pointer-events-none absolute inset-x-1 top-0 rounded-b-lg bg-gradient-to-b from-violet-100/90 to-transparent"
                      aria-hidden
                    />
                  </th>
                  <th className="px-2 py-4 pr-5 text-center text-xs font-bold uppercase tracking-wide text-gray-600">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50/80">
                {comparisonFeatures.map(([feature, pioneer, premium, enterprise], i) => (
                  <tr
                    key={feature}
                    className={
                      i % 2 === 0 ? "bg-white" : "bg-rose-50/20 hover:bg-violet-50/15"
                    }
                  >
                    <td className="py-3.5 pl-5 font-medium text-gray-800">{feature}</td>
                    <td className="px-2 py-3.5 text-center text-gray-600">{pioneer}</td>
                    <td className="bg-violet-50/25 px-2 py-3.5 text-center font-medium text-gray-800">
                      {premium}
                    </td>
                    <td className="px-2 py-3.5 pr-5 text-center text-gray-600">
                      {enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-rose-100/60 bg-gradient-to-b from-white to-rose-50/30 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-3 text-gray-600">
              Straightforward answers before you talk to sales or start a trial.
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

      {/* Current Referral Sites */}
      <section className="bg-gradient-to-b from-rose-50/20 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Current referral sites
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              See how active brands are using Referrals.com to drive measurable growth.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {currentReferralSites.map((site) => (
              <div
                key={site.name}
                className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-gradient-to-r from-rose-100 to-orange-50 px-3 py-1 text-xs font-semibold text-[#ff4f58]">
                    Live site
                  </span>
                  <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{site.domain}</p>
                <p className="mt-4 text-sm font-medium text-gray-700">{site.metric}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-rose-100">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#ff646c] to-[#926efb]" />
                </div>
              </div>
            ))}
          </div>
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
              Teams are scaling referrals faster with plans that match their stage.
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
            Ready to grow your business?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
            >
              Start free trial
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-xl border-2 border-white/40 bg-white/10 px-8 py-3.5 text-lg font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

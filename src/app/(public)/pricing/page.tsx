import { Metadata } from "next";
import Link from "next/link";

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

export default function PricingPage() {
  return (
    <div className="bg-[#212529]">
      {/* Hero */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Start free. Upgrade when you are ready. No hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-[#926efb]/30 bg-[#292A2D]"
                    : "border-white/10 bg-[#292A2D]"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 right-6 rounded-full bg-[#926efb] px-3 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <h2 className="text-xl font-semibold text-white">
                  {tier.name}
                </h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-gray-400">{tier.period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-400">{tier.description}</p>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-gray-300"
                    >
                      <svg
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: tier.accent }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
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
                  className="mt-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: tier.accent,
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="bg-[#1a1d21] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white">
            Feature Comparison
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 text-left font-medium text-gray-400">
                    Feature
                  </th>
                  <th className="py-4 text-center font-medium text-gray-400">
                    Pioneer
                  </th>
                  <th className="py-4 text-center font-medium text-[#926efb]">
                    Premium
                  </th>
                  <th className="py-4 text-center font-medium text-gray-400">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonFeatures.map(
                  ([feature, pioneer, premium, enterprise]) => (
                    <tr key={feature} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-3 text-gray-300">{feature}</td>
                      <td className="py-3 text-center text-gray-400">
                        {pioneer}
                      </td>
                      <td className="py-3 text-center text-gray-300">
                        {premium}
                      </td>
                      <td className="py-3 text-center text-gray-400">
                        {enterprise}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#ff646c] to-[#ff4f58] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to grow your business?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Start your free trial today. No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}

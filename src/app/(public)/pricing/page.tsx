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
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with referral marketing.",
    features: [
      "1 brand",
      "1 campaign",
      "Up to 500 participants",
      "Basic widget templates",
      "Social sharing (Facebook, Twitter)",
      "Email notifications",
      "Community forum access",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses that need more power and flexibility.",
    features: [
      "Unlimited brands",
      "Unlimited campaigns",
      "Up to 10,000 participants",
      "All widget templates",
      "All social channels",
      "Custom reward rules",
      "Email campaigns via SES",
      "API access",
      "Priority support",
      "Advanced analytics",
      "Remove branding",
    ],
    cta: "Start Pro Trial",
    ctaHref: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams with advanced needs and dedicated support.",
    features: [
      "Everything in Pro",
      "Unlimited participants",
      "White-label solution",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "SSO / SAML",
      "Custom contracts",
      "Onboarding assistance",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Start free. Upgrade when you are ready. No hidden fees.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl border p-8 ${
              tier.highlighted
                ? "border-blue-600 ring-2 ring-blue-600"
                : "border-gray-200"
            }`}
          >
            {tier.highlighted && (
              <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Most Popular
              </span>
            )}
            <h2 className="text-xl font-semibold text-gray-900">{tier.name}</h2>
            <div className="mt-2">
              <span className="text-4xl font-bold text-gray-900">
                {tier.price}
              </span>
              {tier.period && (
                <span className="text-gray-500">{tier.period}</span>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600">{tier.description}</p>

            <ul className="mt-6 space-y-3">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
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
              className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
                tier.highlighted
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Feature Comparison
        </h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium text-gray-500">
                  Feature
                </th>
                <th className="py-3 text-center font-medium text-gray-500">
                  Free
                </th>
                <th className="py-3 text-center font-medium text-gray-500">
                  Pro
                </th>
                <th className="py-3 text-center font-medium text-gray-500">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["Brands", "1", "Unlimited", "Unlimited"],
                ["Campaigns", "1", "Unlimited", "Unlimited"],
                ["Participants", "500", "10,000", "Unlimited"],
                ["Widget Templates", "Basic", "All", "All + Custom"],
                ["Social Sharing", "2 channels", "All channels", "All channels"],
                ["Email Campaigns", "No", "Yes", "Yes"],
                ["API Access", "No", "Yes", "Yes"],
                ["Remove Branding", "No", "Yes", "Yes"],
                ["White-label", "No", "No", "Yes"],
                ["Support", "Community", "Priority", "Dedicated"],
              ].map(([feature, free, pro, enterprise]) => (
                <tr key={feature}>
                  <td className="py-3 text-gray-700">{feature}</td>
                  <td className="py-3 text-center text-gray-600">{free}</td>
                  <td className="py-3 text-center text-gray-600">{pro}</td>
                  <td className="py-3 text-center text-gray-600">
                    {enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

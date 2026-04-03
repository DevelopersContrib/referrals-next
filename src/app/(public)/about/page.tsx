import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
  openGraph: {
    title: "About Us | Referrals.com",
    description:
      "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
    url: "https://referrals.com/about",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Us | Referrals.com",
    description:
      "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        About Referrals.com
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        We help businesses unlock the power of word-of-mouth marketing through
        simple, effective referral campaigns.
      </p>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Our Mission</h2>
          <p className="mt-3 text-gray-600">
            Referrals.com was built with one goal: make it easy for any business
            to launch and manage a referral program. Whether you are a solo
            founder or a growing enterprise, our platform gives you the tools to
            turn satisfied customers into your most effective marketing channel.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">What We Do</h2>
          <ul className="mt-3 space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
              <span>
                Provide embeddable referral widgets you can add to any website in
                minutes.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
              <span>
                Track every share, click, and signup so you know exactly what is
                working.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
              <span>
                Automate rewards with coupons, cash payouts, or custom
                incentives.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
              <span>
                Integrate with the tools you already use through our REST API and
                Zapier.
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">Our Story</h2>
          <p className="mt-3 text-gray-600">
            Founded by marketers and developers who saw firsthand how powerful
            referrals can be, Referrals.com started as a simple widget builder
            and grew into a full-featured referral marketing platform trusted by
            thousands of businesses worldwide. We believe growth should be
            accessible to everyone, not just companies with big marketing
            budgets.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Why Choose Us
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900">Easy Setup</h3>
              <p className="mt-2 text-sm text-gray-600">
                Launch a referral campaign in under five minutes with no coding
                required.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900">
                Real-Time Analytics
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Monitor shares, clicks, and conversions with a live dashboard.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900">
                Flexible Rewards
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Offer coupons, cash, or custom rewards to match your brand.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

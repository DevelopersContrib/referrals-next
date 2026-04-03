import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Grow Your Business
            <br />
            <span className="text-blue-600">Through Referrals</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Create powerful referral campaigns, embed widgets on your site,
            reward your participants, and track every share, click, and
            conversion. The all-in-one referral platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Start for Free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything You Need to Run Referral Campaigns
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Embeddable Widgets",
                description:
                  "Drop a single script tag on your site. Popups, inline forms, floating bars — your brand, your style.",
              },
              {
                title: "Reward System",
                description:
                  "Coupons, cash, tokens, redirects — multiple reward types to incentivize sharing and referrals.",
              },
              {
                title: "Real-Time Analytics",
                description:
                  "Track shares, clicks, impressions, and conversions per campaign, brand, or participant.",
              },
              {
                title: "Multi-Brand Support",
                description:
                  "Manage multiple brands and domains from a single dashboard with independent campaigns.",
              },
              {
                title: "Social Sharing",
                description:
                  "Pre-built share buttons for Facebook, Twitter, LinkedIn, Email, and WhatsApp with tracking.",
              },
              {
                title: "API & Integrations",
                description:
                  "REST API, Zapier, MailChimp, Shopify — connect your referral program to your existing stack.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to supercharge your growth?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of businesses using Referrals.com to drive
            word-of-mouth growth.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-600 shadow-sm hover:bg-gray-50"
          >
            Create Your First Campaign
          </Link>
        </div>
      </section>
    </div>
  );
}

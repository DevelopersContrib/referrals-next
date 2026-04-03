import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Whitelabel Referral Platform",
  description: "Run referral programs under your own brand. Custom domains, subdomains, and full branding control with Referrals.com whitelabel solution.",
  openGraph: { title: "Whitelabel | Referrals.com", description: "Fully branded referral platform under your own domain.", url: "https://referrals.com/whitelabel" },
};

export default function WhitelabelPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Your Brand. Your Referral Platform.
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Run a fully branded referral program under your own domain. No &quot;Powered by&quot; badges, no third-party branding — just your brand, everywhere.
          </p>
          <Link href="/signup" className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700">
            Get Started
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Whitelabel Features</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Custom Domain</h3>
              <p className="mt-2 text-gray-600">
                Point your own domain (e.g., refer.yourbrand.com) to your referral platform. Just add a CNAME record and you&apos;re live.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Custom Subdomain</h3>
              <p className="mt-2 text-gray-600">
                Get a branded subdomain instantly (yourbrand.referrals.com). No DNS configuration required — it works immediately.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Branded Emails</h3>
              <p className="mt-2 text-gray-600">
                Customize every email template — referral invites, reward notifications, campaign entries — all with your branding.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Widget Customization</h3>
              <p className="mt-2 text-gray-600">
                Match your embeddable referral widgets to your brand colors, fonts, and messaging. Live preview as you design.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Landing Pages</h3>
              <p className="mt-2 text-gray-600">
                Public referral and campaign pages are served under your domain with your branding. No Referrals.com branding visible.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Multi-Brand Support</h3>
              <p className="mt-2 text-gray-600">
                Manage multiple brands from one account. Each brand gets its own domain, campaigns, and analytics — completely independent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Launch Your Branded Referral Platform</h2>
          <p className="mt-4 text-lg text-blue-100">
            Set up in minutes. No coding required. Full control over every touchpoint.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/signup" className="rounded-lg bg-white px-6 py-3 text-lg font-semibold text-blue-600 hover:bg-gray-50">
              Start Free
            </Link>
            <Link href="/pricing" className="rounded-lg border border-white px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

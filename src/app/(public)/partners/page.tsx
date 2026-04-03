import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partners",
  description: "Explore Referrals.com partner ecosystem. Integration partners, agencies, and affiliate partners growing together.",
  openGraph: { title: "Partners | Referrals.com", description: "Join the Referrals.com partner ecosystem.", url: "https://referrals.com/partners" },
};

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Partner With Us</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Grow your business alongside Referrals.com. Whether you&apos;re an agency, technology partner, or affiliate, there&apos;s a partnership program for you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🔗</span>
          </div>
          <h2 className="text-xl font-semibold">Integration Partners</h2>
          <p className="mt-2 text-gray-600">
            Build integrations with Referrals.com and get listed in our marketplace. Access our REST API and webhooks.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="text-xl font-semibold">Agency Partners</h2>
          <p className="mt-2 text-gray-600">
            Offer referral marketing services to your clients. Get volume discounts, co-branded materials, and priority support.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <span className="text-2xl">💰</span>
          </div>
          <h2 className="text-xl font-semibold">Affiliate Program</h2>
          <p className="mt-2 text-gray-600">
            Earn commissions by referring new customers to Referrals.com. Get your unique referral link and start earning.
          </p>
        </div>
      </div>

      <div className="mt-16 rounded-xl bg-blue-50 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to Partner?</h2>
        <p className="mt-2 text-gray-600">Get in touch and let&apos;s explore how we can grow together.</p>
        <Link href="/contact" className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
          Contact Us
        </Link>
      </div>
    </div>
  );
}

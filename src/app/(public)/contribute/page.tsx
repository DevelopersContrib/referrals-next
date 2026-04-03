import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contribute & Partner",
  description: "Partner with Referrals.com. Explore integration, affiliate, and contribution opportunities.",
};

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Contribute & Partner
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          There are many ways to get involved with Referrals.com. Whether you
          want to integrate, partner, or contribute, we&apos;d love to work with
          you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="rounded-lg border p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Integration Partners
          </h2>
          <p className="mt-3 text-gray-600">
            Build integrations with Referrals.com using our REST API. Connect
            your product to our referral engine and offer your users built-in
            referral capabilities.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Full REST API documentation
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Webhooks for real-time events
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Technical support for partners
            </li>
          </ul>
        </div>

        <div className="rounded-lg border p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Affiliate Program
          </h2>
          <p className="mt-3 text-gray-600">
            Earn commissions by promoting Referrals.com to your audience. Our
            affiliate program offers competitive payouts and dedicated support.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Competitive commission rates
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Marketing materials provided
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Real-time tracking dashboard
            </li>
          </ul>
        </div>

        <div className="rounded-lg border p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Content Contributors
          </h2>
          <p className="mt-3 text-gray-600">
            Share your knowledge with the community. Write guest posts, create
            tutorials, or contribute case studies about referral marketing.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Guest blog opportunities
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Case study features
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Community recognition
            </li>
          </ul>
        </div>

        <div className="rounded-lg border p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Agency Partners
          </h2>
          <p className="mt-3 text-gray-600">
            Are you a marketing agency? Partner with us to offer referral
            marketing services to your clients with preferred pricing and
            support.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              White-label options
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Volume discounts
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
              Dedicated partner manager
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Interested in partnering with us?
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get in Touch
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  CodeIcon,
  PlayIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  KeyIcon,
  ArrowRightIcon,
  ZapIcon,
  ShieldCheckIcon,
  WebhookIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Portal | Referrals.com",
  description:
    "Build powerful referral integrations with the Referrals.com REST API. Documentation, playground, knowledgebase, and support.",
  openGraph: {
    title: "Developer Portal | Referrals.com",
    description:
      "Build powerful referral integrations with the Referrals.com REST API.",
    url: "https://referrals.com/developer",
    siteName: "Referrals.com",
    type: "website",
  },
};

const SECTIONS = [
  {
    href: "/developer/docs",
    icon: CodeIcon,
    title: "API Reference",
    description:
      "Complete REST API documentation with request/response examples for every endpoint.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/developer/playground",
    icon: PlayIcon,
    title: "API Playground",
    description:
      "Test API calls live in your browser. Enter your API key and explore endpoints interactively.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/developer/knowledgebase",
    icon: BookOpenIcon,
    title: "Knowledgebase",
    description:
      "Guides, tutorials, and best practices for integrating referral programs into your product.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/developer/support",
    icon: LifeBuoyIcon,
    title: "Support",
    description:
      "Get help with your integration. FAQs, troubleshooting, and contact our developer support team.",
    color: "bg-orange-50 text-orange-600",
  },
];

export default function DeveloperPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Referrals.com Developer Portal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Build and automate referral programs with our REST API. Create
            brands, launch campaigns, track participants, and process rewards
            programmatically.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/developer/docs"
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C62] px-6 py-3 font-medium text-white hover:bg-[#ff4f58] transition"
            >
              <CodeIcon className="size-4" />
              View API Docs
            </Link>
            <Link
              href="/developer/playground"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition"
            >
              <PlayIcon className="size-4" />
              Try Playground
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-16">
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Quick Start
          </h2>
          <div className="space-y-4 rounded-xl border bg-white p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF5C62] text-xs font-bold text-white">
                1
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Create an account &amp; generate an API key
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Sign up at{" "}
                  <Link href="/signup" className="text-[#FF5C62] hover:underline">
                    referrals.com/signup
                  </Link>
                  , then go to{" "}
                  <Link href="/api-keys" className="text-[#FF5C62] hover:underline">
                    API Keys
                  </Link>{" "}
                  in your dashboard. Each key is tied to your account and gives
                  access to all your brands.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF5C62] text-xs font-bold text-white">
                2
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Add your domain as a brand
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl -X POST https://referrals.com/api/v1/brands \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://yourdomain.com", "description": "My Brand"}'`}
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF5C62] text-xs font-bold text-white">
                3
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Launch a campaign
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl -X POST https://referrals.com/api/v1/campaigns \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Summer Referral Program", "url_id": 1}'`}
                </pre>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FF5C62] text-xs font-bold text-white">
                4
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Register participants &amp; track referrals
                </h3>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
{`curl -X POST https://referrals.com/api/v1/signups \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"campaign_id": 1, "email": "user@example.com", "name": "Jane"}'`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Sections */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Explore the Portal
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex gap-4 rounded-xl border bg-white p-6 transition hover:shadow-md"
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#FF5C62] transition-colors">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {s.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Key Features */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            API Highlights
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-6 text-center">
              <KeyIcon className="mx-auto size-8 text-[#FF5C62]" />
              <h3 className="mt-3 font-semibold text-gray-900">
                API Key Per Account
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Generate API keys from your dashboard. One key gives access to
                all your brands and campaigns.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 text-center">
              <WebhookIcon className="mx-auto size-8 text-[#FF5C62]" />
              <h3 className="mt-3 font-semibold text-gray-900">Webhooks</h3>
              <p className="mt-2 text-sm text-gray-600">
                Get notified in real-time when participants sign up. Integrates
                with Zapier and custom endpoints.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 text-center">
              <ShieldCheckIcon className="mx-auto size-8 text-[#FF5C62]" />
              <h3 className="mt-3 font-semibold text-gray-900">
                Reward Processing
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Automatic reward allocation — coupons, cash, and custom
                messages — when referral goals are met.
              </p>
            </div>
          </div>
        </section>

        {/* Base URL + Response */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Base URL</h3>
            <code className="block rounded-lg bg-gray-100 px-4 py-3 text-blue-700">
              https://referrals.com/api/v1
            </code>
          </div>
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Authentication
            </h3>
            <code className="block rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">
              X-API-Key: ref_your_api_key_here
            </code>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <Link
            href="/developer/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C62] px-8 py-3 font-medium text-white hover:bg-[#ff4f58] transition"
          >
            View Full API Documentation
            <ArrowRightIcon className="size-4" />
          </Link>
        </section>
      </main>
    </>
  );
}

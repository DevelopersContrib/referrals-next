import type { Metadata } from "next";
import Link from "next/link";
import {
  MailIcon,
  MessageCircleIcon,
  BookOpenIcon,
  BugIcon,
  ClockIcon,
  CheckCircleIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Support | Referrals.com",
  description:
    "Get help with your Referrals.com API integration. FAQs, troubleshooting, and contact options.",
};

const FAQS = [
  {
    q: "How do I get an API key?",
    a: 'Sign up for a Referrals.com account, go to the API Keys page in your dashboard, and click "Generate API Key". You can also call POST /api/v1/members/api-key programmatically.',
  },
  {
    q: "What is the rate limit?",
    a: "There is currently no hard rate limit, but we ask that you keep requests under 100/minute per API key. Excessive usage may be throttled.",
  },
  {
    q: 'I\'m getting a 401 "Invalid or missing API key" error.',
    a: 'Make sure you\'re sending the key in the X-API-Key header (not as a query parameter). The key should start with "ref_". Check that it hasn\'t been regenerated — generating a new key doesn\'t invalidate old ones, but double-check which key you\'re using.',
  },
  {
    q: "Can I have multiple API keys?",
    a: "Yes. Each call to POST /api/v1/members/api-key creates a new key. All keys for your account remain active.",
  },
  {
    q: "Do I need a paid plan to use the API?",
    a: 'Most API endpoints work on the free plan. Publishing campaigns as "public" requires an active paid subscription.',
  },
  {
    q: "How do webhooks work?",
    a: "Register a URL via POST /api/v1/webhooks. When a participant signs up for the associated campaign, we POST a JSON payload to your URL with the event details.",
  },
  {
    q: "Why isn't my referral reward being processed?",
    a: "Check that: (1) the campaign has goal_type set to 'signup', (2) a campaign_reward record exists, (3) for coupon rewards, unused coupons are available, (4) the referring participant hasn't already received a reward for this campaign.",
  },
  {
    q: "Can I use the API from the browser (CORS)?",
    a: "Yes. All /api/v1/* endpoints return CORS headers allowing requests from any origin. OPTIONS preflight requests are handled automatically.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Developer Support
        </h1>
        <p className="mt-1 text-gray-600">
          Get help with your integration. Check our FAQ first, or reach out to
          the team.
        </p>
      </div>

      {/* Contact Options */}
      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        <Link
          href="/contact"
          className="flex flex-col items-center gap-3 rounded-xl border bg-white p-6 text-center hover:shadow-md transition"
        >
          <MailIcon className="size-8 text-[#FF5C62]" />
          <h3 className="font-semibold text-gray-900">Email Support</h3>
          <p className="text-sm text-gray-600">
            support@referrals.com
          </p>
        </Link>
        <Link
          href="/forum"
          className="flex flex-col items-center gap-3 rounded-xl border bg-white p-6 text-center hover:shadow-md transition"
        >
          <MessageCircleIcon className="size-8 text-[#FF5C62]" />
          <h3 className="font-semibold text-gray-900">Community Forum</h3>
          <p className="text-sm text-gray-600">
            Ask the community and our team
          </p>
        </Link>
        <Link
          href="/developer/knowledgebase"
          className="flex flex-col items-center gap-3 rounded-xl border bg-white p-6 text-center hover:shadow-md transition"
        >
          <BookOpenIcon className="size-8 text-[#FF5C62]" />
          <h3 className="font-semibold text-gray-900">Knowledgebase</h3>
          <p className="text-sm text-gray-600">
            Guides and best practices
          </p>
        </Link>
      </div>

      {/* Status */}
      <div className="mb-12 rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircleIcon className="size-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-900">API Status</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-700">API v1 — Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-700">
              Widget API — Operational
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-700">
              Webhooks — Operational
            </span>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mb-12 rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <BugIcon className="size-5 text-[#FF5C62]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Troubleshooting Checklist
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            Verify your API key is in the <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header, not query params
          </li>
          <li className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            Check Content-Type is <code className="bg-gray-100 px-1 rounded">application/json</code> for POST/PUT requests
          </li>
          <li className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            Ensure IDs in URLs are integers, not strings
          </li>
          <li className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            For 404 errors, verify the resource belongs to your account
          </li>
          <li className="flex items-start gap-2">
            <ClockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
            For webhook failures, check that the URL is publicly reachable and returns a 2xx response
          </li>
        </ul>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="group rounded-xl border bg-white overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium text-gray-900 hover:bg-gray-50 transition">
                {faq.q}
                <svg
                  className="size-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t px-6 py-4 text-sm text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

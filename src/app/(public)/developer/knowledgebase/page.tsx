import type { Metadata } from "next";
import Link from "next/link";
import {
  KeyIcon,
  GlobeIcon,
  ZapIcon,
  ShieldCheckIcon,
  WebhookIcon,
  CodeIcon,
  BookOpenIcon,
  LayersIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Knowledgebase | Referrals.com",
  description:
    "Guides, tutorials, and best practices for integrating the Referrals.com API into your product.",
};

const GUIDES = [
  {
    icon: KeyIcon,
    title: "API Keys & Authentication",
    content: [
      "API keys are generated per member account from the dashboard at /api-keys or via POST /api/v1/members/api-key.",
      'Keys use the format ref_ followed by 48 hex characters (e.g. ref_a1b2c3...).',
      "Include your key in the X-API-Key header on every authenticated request.",
      "You can also exchange email + password for a JWT token via POST /api/v1/auth/token. Tokens expire after 30 days.",
      "Each API key has access to all brands and campaigns owned by that member account.",
    ],
  },
  {
    icon: GlobeIcon,
    title: "Brands (Domains)",
    content: [
      "A brand represents a domain/website you want to run referral campaigns for.",
      "Create a brand with POST /api/v1/brands — just pass your website URL and we auto-extract the domain.",
      "Each brand has its own campaigns, participants, and stats.",
      "You can manage multiple brands under one account — perfect for agencies or multi-site businesses.",
      "Brand stats are available at GET /api/v1/brands/:brandId/stats (total campaigns, participants, shares, clicks, impressions).",
    ],
  },
  {
    icon: LayersIcon,
    title: "Campaigns",
    content: [
      "Campaigns are referral programs tied to a specific brand.",
      'Set goal_type to "signup" or "visit" to define how rewards are triggered.',
      "num_signups controls how many referrals a participant needs before earning a reward.",
      'Campaigns can be "public" (requires paid plan) or "private".',
      "Each campaign can have its own widget, lander page, reward configuration, and contest.",
    ],
  },
  {
    icon: ZapIcon,
    title: "Reward Types",
    content: [
      "Type 1 — Coupon: Upload coupon codes to the campaign. When a referral goal is met, the next available coupon is assigned and marked as used.",
      "Type 3 — Custom Message: A free-form message displayed to the participant when their goal is met.",
      "Type 5 — Cash: A dollar value recorded against the participant's reward record.",
      "Type 4 — Crypto Token (legacy): Token transfer via blockchain. Only available for VNOC-linked domains.",
      "Two-way rewards: Enable reward_invited on the campaign to also reward the newly referred user.",
    ],
  },
  {
    icon: WebhookIcon,
    title: "Webhooks & Zapier",
    content: [
      "Register webhook URLs at POST /api/v1/webhooks — we POST a JSON payload when a participant signs up.",
      "Payload includes event type, participant details, campaign ID, and signup timestamp.",
      "For Zapier: use POST /api/v1/zapier/auth to validate your key, and GET /api/v1/zapier/contacts as the polling trigger.",
      "You can scope webhooks to a specific campaign_id, or leave it null for account-wide notifications.",
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: "Referral Signup Flow",
    content: [
      "Basic signup: POST /api/v1/signups — creates a participant record and fires any configured webhook.",
      "Referral signup: POST /api/v1/signups/referral — pass a base64-encoded referral code to track who referred whom and automatically process rewards.",
      'The referral code encodes "campaign_id:social_type:participant_id[:invited_id]".',
      "If a participant was already invited by someone else, the API returns a message instead of overwriting the referral chain.",
      "Widget-based signups at POST /api/widget/signup handle the same flow for embedded widgets.",
    ],
  },
  {
    icon: BookOpenIcon,
    title: "Lander Pages",
    content: [
      "Each campaign can have a landing page configuration (campaign_lander) with custom header, footer, background, and fonts.",
      "Retrieve it via GET /api/v1/lander?campaign_id=123 — returns lander settings plus brand info and social URLs.",
      "If no custom lander exists, a default template is returned with the brand's background image.",
      "Lander templates are managed in the dashboard editor.",
    ],
  },
  {
    icon: CodeIcon,
    title: "Response Format & Pagination",
    content: [
      'All responses return { "success": true/false, "data": ... } or { "success": false, "error": "..." }.',
      "List endpoints support ?page=1&limit=20 (max 100 per page).",
      "Pagination metadata is included: { page, limit, total, totalPages }.",
      "HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found), 409 (conflict), 500 (server error).",
    ],
  },
];

export default function KnowledgebasePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Developer Knowledgebase
        </h1>
        <p className="mt-1 text-gray-600">
          In-depth guides and best practices for every part of the API.
        </p>
      </div>

      <div className="space-y-8">
        {GUIDES.map((guide) => {
          const Icon = guide.icon;
          return (
            <section
              key={guide.title}
              id={guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
              className="rounded-xl border bg-white overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b bg-gray-50 px-6 py-4">
                <Icon className="size-5 text-[#FF5C62]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {guide.title}
                </h2>
              </div>
              <ul className="divide-y">
                {guide.content.map((item, i) => (
                  <li key={i} className="px-6 py-3 text-sm text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 mb-4">
          Can&apos;t find what you&apos;re looking for?
        </p>
        <Link
          href="/developer/support"
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C62] px-6 py-3 font-medium text-white hover:bg-[#ff4f58] transition"
        >
          Contact Developer Support
        </Link>
      </div>
    </div>
  );
}

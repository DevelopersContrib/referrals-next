import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MailIcon,
  MessageCircleIcon,
  BookOpenIcon,
  BugIcon,
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
    a: 'Most API endpoints work during your Growth trial and on free forever (capped). Publishing campaigns as "public", multi-domain brands, and other Growth features require an active Growth trial or paid Growth subscription ($9/mo per brand).',
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

const CONTACTS = [
  {
    href: "/contact",
    icon: MailIcon,
    title: "Email Support",
    desc: "support@referrals.com",
  },
  {
    href: "/forum",
    icon: MessageCircleIcon,
    title: "Community Forum",
    desc: "Ask the community and our team",
  },
  {
    href: "/developer/knowledgebase",
    icon: BookOpenIcon,
    title: "Knowledgebase",
    desc: "Guides and best practices",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Developer Support</h1>
        <p className="mt-1 text-muted-foreground">
          Get help with your integration. Check our FAQ first, or reach out to
          the team.
        </p>
      </div>

      {/* Contact Options */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {CONTACTS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group">
              <Card className="h-full text-center transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <Icon className="size-8 text-brand" />
                  <h3 className="font-heading font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* API Status */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="size-5 text-emerald-500" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {["API v1", "Widget API", "Webhooks"].map((service) => (
              <div key={service} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm">
                  {service} — Operational
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BugIcon className="size-5 text-brand" />
            Troubleshooting Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                Verify your API key is in the{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  X-API-Key
                </code>{" "}
                header, not query params
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                Check Content-Type is{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  application/json
                </code>{" "}
                for POST/PUT requests
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>Ensure IDs in URLs are integers, not strings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                For 404 errors, verify the resource belongs to your account
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                For webhook failures, check the URL is publicly reachable and
                returns a 2xx response
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* FAQs */}
      <div>
        <h2 className="mb-6 font-heading text-xl font-bold">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Card key={i} className="overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-medium transition-colors hover:bg-muted/50">
                  {faq.q}
                  <svg
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
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
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

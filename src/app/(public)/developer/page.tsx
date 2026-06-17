import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/developer/code-block";
import { cn } from "@/lib/utils";
import {
  CodeIcon,
  PlayIcon,
  BookOpenIcon,
  LifeBuoyIcon,
  KeyIcon,
  ArrowRightIcon,
  WebhookIcon,
  ShieldCheckIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Developer Portal | Referrals.com",
  description:
    "Build powerful referral integrations with the Referrals.com REST API. Documentation, playground, knowledgebase, and support.",
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

const HIGHLIGHTS = [
  {
    icon: KeyIcon,
    title: "API Key Auth",
    description:
      "Generate API keys from your dashboard. One key gives access to all your brands and campaigns.",
  },
  {
    icon: WebhookIcon,
    title: "Webhooks",
    description:
      "Get notified in real-time when participants sign up. Integrates with Zapier and custom endpoints.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Reward Processing",
    description:
      "Automatic reward allocation — coupons, cash, and custom messages — when referral goals are met.",
  },
];

export default function DeveloperPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="mb-4 border-white/20 bg-white/10 text-white"
          >
            REST API v1
          </Badge>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            Referrals.com Developer Portal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Build and automate referral programs with our REST API. Create
            brands, launch campaigns, track participants, and process rewards
            programmatically.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/developer/docs">
              <Button
                size="lg"
                className="h-11 gap-2 bg-brand px-6 text-base text-white hover:bg-brand-hover"
              >
                <CodeIcon className="size-4" />
                View API Docs
              </Button>
            </Link>
            <Link href="/developer/playground">
              <Button
                variant="outline"
                size="lg"
                className="h-11 gap-2 border-white/20 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white"
              >
                <PlayIcon className="size-4" />
                Try Playground
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6">
        {/* Quick Start */}
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold">Quick Start</h2>
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold">
                    Create an account &amp; generate an API key
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sign up at{" "}
                    <Link
                      href="/signup"
                      className="text-brand hover:underline"
                    >
                      referrals.com/signup
                    </Link>
                    , then go to{" "}
                    <Link
                      href="/api-keys"
                      className="text-brand hover:underline"
                    >
                      API Keys
                    </Link>{" "}
                    in your dashboard. Each key is scoped to your account.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold">
                    Add your domain as a brand
                  </h3>
                  <CodeBlock
                    className="mt-3"
                    code={`curl -X POST https://referrals.com/api/v1/brands \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://yourdomain.com", "description": "My Brand"}'`}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  3
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold">
                    Launch a campaign
                  </h3>
                  <CodeBlock
                    className="mt-3"
                    code={`curl -X POST https://referrals.com/api/v1/campaigns \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Summer Referral Program", "url_id": 1}'`}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  4
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-semibold">
                    Register participants &amp; track referrals
                  </h3>
                  <CodeBlock
                    className="mt-3"
                    code={`curl -X POST https://referrals.com/api/v1/signups \\
  -H "X-API-Key: ref_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"campaign_id": 1, "email": "user@example.com", "name": "Jane"}'`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Explore the Portal */}
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold">
            Explore the Portal
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={s.href} className="group">
                  <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <CardContent className="flex gap-4">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg",
                          s.color
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold transition-colors group-hover:text-brand">
                          {s.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* API Highlights */}
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold">
            API Highlights
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="stat-card text-center">
                  <Icon className="mx-auto size-8 text-brand" />
                  <h3 className="mt-3 font-heading font-semibold">
                    {h.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {h.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Base URL + Auth */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <h3 className="mb-3 font-heading font-semibold">Base URL</h3>
              <code className="block rounded-lg bg-muted px-4 py-3 font-mono text-sm text-brand">
                https://referrals.com/api/v1
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h3 className="mb-3 font-heading font-semibold">
                Authentication
              </h3>
              <code className="block rounded-lg bg-muted px-4 py-3 font-mono text-sm">
                X-API-Key: ref_your_api_key_here
              </code>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="py-4 text-center">
          <Link href="/developer/docs">
            <Button
              size="lg"
              className="h-11 gap-2 bg-brand px-8 text-base text-white hover:bg-brand-hover"
            >
              View Full API Documentation
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </section>
      </main>
    </>
  );
}

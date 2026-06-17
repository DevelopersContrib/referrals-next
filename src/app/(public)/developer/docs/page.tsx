import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/developer/code-block";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "API Reference | Referrals.com",
  description:
    "Complete API reference for Referrals.com. Endpoints for members, brands, campaigns, participants, webhooks, and billing.",
};

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
}

const sections: { title: string; endpoints: Endpoint[] }[] = [
  {
    title: "Authentication",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/auth/token",
        description: "Exchange email and password for a JWT token.",
        auth: false,
        body: `{ "email": "user@example.com", "password": "secret" }`,
        response: `{ "success": true, "data": { "token": "eyJ...", "member": { "id": 1, "email": "...", "name": "..." } } }`,
      },
    ],
  },
  {
    title: "Members",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/members",
        description: "Register a new member (public).",
        auth: false,
        body: `{ "email": "new@example.com", "name": "Jane Doe", "password": "securepass" }`,
        response: `{ "success": true, "data": { "id": 42, "email": "...", "name": "...", "date_signedup": "..." } }`,
      },
      {
        method: "GET",
        path: "/api/v1/members/profile",
        description: "Get authenticated member profile.",
        auth: true,
        response: `{ "success": true, "data": { "id": 1, "email": "...", "name": "...", "plan_id": 2, ... } }`,
      },
      {
        method: "POST",
        path: "/api/v1/members/api-key",
        description: "Generate a new API key.",
        auth: true,
        response: `{ "success": true, "data": { "api_key": "ref_abc123...", "date_generated": "..." } }`,
      },
      {
        method: "GET",
        path: "/api/v1/members/api-key",
        description: "Get current API key.",
        auth: true,
        response: `{ "success": true, "data": { "api_key": "ref_abc123...", "date_generated": "..." } }`,
      },
    ],
  },
  {
    title: "Brands",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/brands",
        description: "List all brands. Supports ?page=1&limit=20.",
        auth: true,
        response: `{ "success": true, "data": { "brands": [...], "pagination": { ... } } }`,
      },
      {
        method: "POST",
        path: "/api/v1/brands",
        description: "Create a new brand.",
        auth: true,
        body: `{ "url": "https://mybrand.com", "description": "My Brand" }`,
        response: `{ "success": true, "data": { "id": 5, "url": "...", "domain": "...", ... } }`,
      },
      {
        method: "GET",
        path: "/api/v1/brands/:brandId",
        description: "Get a single brand by ID.",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/v1/brands/:brandId",
        description: "Update a brand.",
        auth: true,
        body: `{ "description": "Updated description", "logo_url": "https://..." }`,
      },
      {
        method: "DELETE",
        path: "/api/v1/brands/:brandId",
        description: "Delete a brand.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/v1/brands/:brandId/stats",
        description:
          "Get brand analytics (campaigns, participants, shares, clicks, impressions).",
        auth: true,
      },
    ],
  },
  {
    title: "Campaigns",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/campaigns",
        description:
          "List campaigns. Filter with ?brand_id=5. Supports pagination.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/v1/campaigns",
        description: "Create a new campaign.",
        auth: true,
        body: `{ "name": "Summer Promo", "url_id": 5, "type_id": 1, "reward_type": 1 }`,
      },
      {
        method: "GET",
        path: "/api/v1/campaigns/:campaignId",
        description:
          "Get campaign details including widget, reward, and contest info.",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/v1/campaigns/:campaignId",
        description: "Update a campaign.",
        auth: true,
        body: `{ "name": "Updated Name", "publish": "public" }`,
      },
      {
        method: "DELETE",
        path: "/api/v1/campaigns/:campaignId",
        description: "Delete a campaign and related records.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/v1/campaigns/:campaignId/stats",
        description:
          "Get campaign stats (participants, shares, clicks, impressions, daily signups).",
        auth: true,
      },
    ],
  },
  {
    title: "Participants",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/participants",
        description:
          "List participants across your campaigns. Filter with ?campaign_id=10.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/v1/participants/:participantId",
        description:
          "Get participant detail with shares, rewards, and invited emails.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/v1/signups",
        description: "Register a participant signup externally.",
        auth: true,
        body: `{ "campaign_id": 10, "email": "participant@example.com", "name": "John" }`,
      },
    ],
  },
  {
    title: "Webhooks",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/webhooks",
        description: "List registered webhooks.",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/v1/webhooks",
        description: "Register a new webhook URL.",
        auth: true,
        body: `{ "link": "https://hooks.zapier.com/...", "campaign_id": 10 }`,
      },
      {
        method: "PUT",
        path: "/api/v1/webhooks/:webhookId",
        description: "Update a webhook.",
        auth: true,
      },
      {
        method: "DELETE",
        path: "/api/v1/webhooks/:webhookId",
        description: "Delete a webhook.",
        auth: true,
      },
    ],
  },
  {
    title: "Zapier Integration",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/zapier/auth",
        description: "Validate API key for Zapier authentication test.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/v1/zapier/contacts",
        description:
          "Get participants for Zapier polling trigger. Filter with ?campaign_id=10.",
        auth: true,
      },
    ],
  },
  {
    title: "Lander",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/lander?campaign_id=123",
        description:
          "Get lander page configuration for a campaign. Returns template, header/footer text, background settings, brand info, and social URLs.",
        auth: true,
        response: `{ "success": true, "data": { "lander": { "template": "default", "header_text": "...", ... }, "brand": { "domain": "...", "logo_url": "..." }, "social_urls": [...] } }`,
      },
    ],
  },
  {
    title: "Referral Signups",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/signups/referral",
        description:
          "Process a referral signup with a base64-encoded referral code. Tracks who referred whom and automatically processes rewards (coupon, cash, or custom message).",
        auth: true,
        body: `{ "referral_code": "base64_encoded_string", "email": "newuser@example.com", "name": "New User" }`,
        response: `{ "success": true, "data": { "participant": { "id": 55, ... }, "reward": { "type": "coupon", "value": "SAVE20" } } }`,
      },
    ],
  },
  {
    title: "Billing",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/billing/plans",
        description: "List all available subscription plans (public endpoint).",
        auth: false,
      },
    ],
  },
];

const METHOD_STYLES: Record<string, string> = {
  GET: "border-emerald-200 bg-emerald-50 text-emerald-700",
  POST: "border-blue-200 bg-blue-50 text-blue-700",
  PUT: "border-amber-200 bg-amber-50 text-amber-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="hidden w-44 shrink-0 md:block">
          <div className="sticky top-32 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </p>
            {sections.map((section) => (
              <a
                key={section.title}
                href={`#${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-12">
          <div>
            <h1 className="font-heading text-2xl font-bold">API Reference</h1>
            <p className="mt-1 text-muted-foreground">
              Complete documentation for the Referrals.com REST API v1.
            </p>
          </div>

          {sections.map((section) => (
            <section
              key={section.title}
              id={section.title.toLowerCase().replace(/\s+/g, "-")}
            >
              <h2 className="mb-4 border-b pb-2 font-heading text-xl font-semibold">
                {section.title}
              </h2>

              <div className="space-y-4">
                {section.endpoints.map((ep, idx) => (
                  <Card key={idx}>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono",
                            METHOD_STYLES[ep.method]
                          )}
                        >
                          {ep.method}
                        </Badge>
                        <code className="font-mono text-sm">{ep.path}</code>
                        {ep.auth && (
                          <Badge variant="secondary" className="text-[10px]">
                            Auth Required
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {ep.description}
                      </p>

                      {ep.body && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                            Request Body
                          </p>
                          <CodeBlock code={ep.body} />
                        </div>
                      )}

                      {ep.response && (
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                            Response
                          </p>
                          <CodeBlock code={ep.response} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "API Documentation - Referrals.com",
  description: "Complete API reference for the Referrals.com REST API v1.",
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
        description: "Get brand analytics (campaigns, participants, shares, clicks, impressions).",
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
        description: "List campaigns. Filter with ?brand_id=5. Supports pagination.",
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
        description: "Get campaign details including widget, reward, and contest info.",
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
        description: "Get campaign stats (participants, shares, clicks, impressions, daily signups).",
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
        description: "List participants across your campaigns. Filter with ?campaign_id=10.",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/v1/participants/:participantId",
        description: "Get participant detail with shares, rewards, and invited emails.",
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
        description: "Get participants for Zapier polling trigger. Filter with ?campaign_id=10.",
        auth: true,
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

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/developer" className="text-blue-600 hover:underline text-sm">
              &larr; Developer Portal
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-1">
              API Documentation v1
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="hidden md:block w-48 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            {sections.map((section) => (
              <a
                key={section.title}
                href={`#${section.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="block text-sm text-gray-600 hover:text-blue-600 py-1"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-12">
          {sections.map((section) => (
            <section
              key={section.title}
              id={section.title.toLowerCase().replace(/\s+/g, "-")}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b">
                {section.title}
              </h2>

              <div className="space-y-6">
                {section.endpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          methodColors[ep.method] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-gray-800">
                        {ep.path}
                      </code>
                      {ep.auth && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          Auth Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{ep.description}</p>

                    {ep.body && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Request Body
                        </p>
                        <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto">
                          {ep.body}
                        </pre>
                      </div>
                    )}

                    {ep.response && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Response
                        </p>
                        <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto">
                          {ep.response}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

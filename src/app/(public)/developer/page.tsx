import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Developer API",
  description:
    "Build powerful integrations with the Referrals.com REST API. Full documentation, webhooks, and SDKs.",
  openGraph: {
    title: "Developer API | Referrals.com",
    description:
      "Build powerful integrations with the Referrals.com REST API. Full documentation, webhooks, and SDKs.",
    url: "https://referrals.com/developer",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Developer API | Referrals.com",
    description:
      "Build powerful integrations with the Referrals.com REST API. Full documentation, webhooks, and SDKs.",
  },
};

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Referrals.com Developer Portal
          </h1>
          <p className="mt-2 text-base text-gray-600 sm:text-lg">
            Build and automate referral programs with our REST API
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-10">
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Quick Start
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <p className="text-gray-700">
              The Referrals.com API uses API key authentication. Include your key
              in the <code className="bg-gray-100 px-1 rounded">X-API-Key</code>{" "}
              header with every request.
            </p>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                1. Generate an API Key
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                Go to your dashboard settings or call the API key endpoint:
              </p>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -X POST https://referrals.com/api/v1/members/api-key \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                2. Make Your First Request
              </h3>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`curl https://referrals.com/api/v1/members/profile \\
  -H "X-API-Key: ref_your_api_key_here"`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                3. Create a Brand
              </h3>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -X POST https://referrals.com/api/v1/brands \\
  -H "X-API-Key: ref_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://mybrand.com", "description": "My Brand"}'`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                4. Create a Campaign
              </h3>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -X POST https://referrals.com/api/v1/campaigns \\
  -H "X-API-Key: ref_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Summer Referral Program", "url_id": 1}'`}
              </pre>
            </div>
          </div>
        </section>

        {/* Base URL */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Base URL
          </h2>
          <div className="bg-white rounded-lg border p-6">
            <code className="text-lg text-blue-700">
              https://referrals.com/api/v1
            </code>
            <p className="mt-2 text-gray-600 text-sm">
              All endpoints are relative to this base URL.
            </p>
          </div>
        </section>

        {/* Authentication */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Authentication
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <p className="text-gray-700">
              All API requests (except public endpoints like plan listing) require
              authentication via the{" "}
              <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header.
            </p>
            <p className="text-gray-700">
              You can also exchange email and password for a JWT token via{" "}
              <code className="bg-gray-100 px-1 rounded">
                POST /api/v1/auth/token
              </code>
              .
            </p>
          </div>
        </section>

        {/* Response Format */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Response Format
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <p className="text-gray-700">
              All responses follow a consistent JSON format:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error description"
}`}
            </pre>
          </div>
        </section>

        {/* Pagination */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Pagination
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-3">
            <p className="text-gray-700">
              List endpoints support pagination using{" "}
              <code className="bg-gray-100 px-1 rounded">?page=1&limit=20</code>
              . Maximum limit is 100.
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}`}
            </pre>
          </div>
        </section>

        {/* API Sections */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            API Sections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Authentication",
                desc: "Token exchange and API key management",
                endpoints: 2,
              },
              {
                title: "Members",
                desc: "Registration, profile management",
                endpoints: 3,
              },
              {
                title: "Brands",
                desc: "Create and manage brands with analytics",
                endpoints: 4,
              },
              {
                title: "Campaigns",
                desc: "Full campaign lifecycle management",
                endpoints: 4,
              },
              {
                title: "Participants",
                desc: "View and manage referral participants",
                endpoints: 2,
              },
              {
                title: "Webhooks",
                desc: "Register and manage webhook endpoints",
                endpoints: 3,
              },
              {
                title: "Integrations",
                desc: "Zapier, MailChimp, and Shopify integrations",
                endpoints: 3,
              },
              {
                title: "Billing",
                desc: "View available subscription plans",
                endpoints: 1,
              },
            ].map((section) => (
              <div
                key={section.title}
                className="bg-white rounded-lg border p-5 hover:shadow-sm transition"
              >
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.desc}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {section.endpoints} endpoint
                  {section.endpoints > 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Full Docs Link */}
        <section className="text-center py-8">
          <Link
            href="/developer/docs"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            View Full API Documentation
          </Link>
        </section>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Knowledgebase",
  description: "Learn how to use Referrals.com with our guides, tutorials, and frequently asked questions.",
  openGraph: { title: "Knowledgebase | Referrals.com", description: "Guides, tutorials, and FAQs for Referrals.com.", url: "https://referrals.com/knowledgebase" },
};

const categories = [
  {
    title: "Getting Started",
    articles: [
      { title: "Creating your account", slug: "#creating-account" },
      { title: "Adding your first brand", slug: "#adding-brand" },
      { title: "Setting up your first campaign", slug: "#first-campaign" },
      { title: "Embedding the referral widget", slug: "#embedding-widget" },
    ],
  },
  {
    title: "Campaigns",
    articles: [
      { title: "Campaign types explained", slug: "#campaign-types" },
      { title: "Setting goals (visits vs signups)", slug: "#goals" },
      { title: "Configuring rewards", slug: "#rewards" },
      { title: "Managing coupons", slug: "#coupons" },
      { title: "Social sharing setup", slug: "#social-sharing" },
    ],
  },
  {
    title: "Widgets & Embedding",
    articles: [
      { title: "Widget embed code", slug: "#embed-code" },
      { title: "Widget modes (inline, popup, floating)", slug: "#widget-modes" },
      { title: "Customizing widget appearance", slug: "#widget-customization" },
      { title: "Widget on Shopify stores", slug: "#shopify-widget" },
    ],
  },
  {
    title: "Billing & Plans",
    articles: [
      { title: "Understanding plans", slug: "#plans" },
      { title: "PayPal subscription management", slug: "#paypal" },
      { title: "Upgrading your plan", slug: "#upgrading" },
      { title: "Cancellation and refunds", slug: "#cancellation" },
    ],
  },
  {
    title: "Integrations",
    articles: [
      { title: "MailChimp integration", slug: "#mailchimp" },
      { title: "Shopify integration", slug: "#shopify" },
      { title: "Zapier automation", slug: "#zapier" },
      { title: "Using the REST API", slug: "#rest-api" },
      { title: "Setting up webhooks", slug: "#webhooks" },
    ],
  },
  {
    title: "Analytics & Tracking",
    articles: [
      { title: "Understanding your dashboard stats", slug: "#dashboard-stats" },
      { title: "Click and share tracking", slug: "#tracking" },
      { title: "Exporting participant data", slug: "#exporting" },
      { title: "Share link tracking (/t/ URLs)", slug: "#share-links" },
    ],
  },
];

export default function KnowledgebasePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center">Knowledgebase</h1>
      <p className="mt-4 text-center text-lg text-gray-600">
        Everything you need to know about Referrals.com.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">{cat.title}</h2>
            <ul className="space-y-2">
              {cat.articles.map((article) => (
                <li key={article.slug}>
                  <Link href={article.slug} className="text-sm text-blue-600 hover:underline">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">Can&apos;t find what you&apos;re looking for?</p>
        <Link href="/contact" className="mt-2 inline-block text-blue-600 font-medium hover:underline">
          Contact Support
        </Link>
      </div>
    </div>
  );
}

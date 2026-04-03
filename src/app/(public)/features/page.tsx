import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore all Referrals.com features — referral campaigns, embeddable widgets, reward systems, analytics, integrations, and more.",
  openGraph: { title: "Features | Referrals.com", description: "Everything you need to run a referral program.", url: "https://referrals.com/features" },
};

const features = [
  {
    category: "Campaign Management",
    items: [
      { title: "Multi-Campaign Support", desc: "Run unlimited referral campaigns across multiple brands and domains." },
      { title: "Goal Types", desc: "Set goals based on visits or signups. Track progress in real-time." },
      { title: "Campaign Templates", desc: "Start from pre-built templates or create campaigns from scratch." },
      { title: "Contest & Voting", desc: "Run contests and polls to engage participants and drive competition." },
    ],
  },
  {
    category: "Embeddable Widgets",
    items: [
      { title: "Script Tag Embed", desc: "Add a single line of code to any website. Works on any platform." },
      { title: "Multiple Modes", desc: "Inline, popup, floating bar — choose the mode that fits your site." },
      { title: "Full Customization", desc: "Match your brand colors, fonts, and messaging. Live preview in dashboard." },
      { title: "Mobile Responsive", desc: "Widgets look great on desktop, tablet, and mobile devices." },
    ],
  },
  {
    category: "Reward System",
    items: [
      { title: "Coupon Rewards", desc: "Distribute coupon codes automatically when participants reach goals." },
      { title: "Cash Rewards", desc: "Offer cash incentives for successful referrals." },
      { title: "Token Rewards", desc: "Distribute blockchain tokens to reward participants." },
      { title: "Two-Way Rewards", desc: "Reward both the referrer and the person they referred." },
    ],
  },
  {
    category: "Analytics & Tracking",
    items: [
      { title: "Real-Time Dashboard", desc: "See clicks, shares, impressions, and conversions as they happen." },
      { title: "Share Link Tracking", desc: "Every share gets a unique tracked URL. Know exactly where clicks come from." },
      { title: "Leaderboards", desc: "See your top referrers ranked by clicks, shares, and successful referrals." },
      { title: "CSV Export", desc: "Export participant data, campaign stats, and analytics anytime." },
    ],
  },
  {
    category: "Integrations",
    items: [
      { title: "MailChimp", desc: "Sync participants to your email marketing lists automatically." },
      { title: "Shopify", desc: "Connect your Shopify store for product-based referral campaigns." },
      { title: "Zapier", desc: "Connect to 5,000+ apps with Zapier triggers and actions." },
      { title: "REST API", desc: "Full API access for custom integrations. Webhooks for real-time events." },
    ],
  },
  {
    category: "Whitelabel & Branding",
    items: [
      { title: "Custom Subdomains", desc: "Use your own subdomain (refer.yourbrand.com) for referral pages." },
      { title: "Custom Domains", desc: "Point your own domain to Referrals.com for a fully branded experience." },
      { title: "Brand Management", desc: "Manage multiple brands from a single dashboard with independent campaigns." },
      { title: "Custom Email Templates", desc: "Customize every email your participants receive with your branding." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Platform Features</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to launch, manage, and scale referral programs that drive real growth.
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {features.map((section) => (
          <div key={section.category}>
            <h2 className="text-2xl font-bold mb-6">{section.category}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {section.items.map((item) => (
                <div key={item.title} className="rounded-xl border bg-white p-6 shadow-sm">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold">Ready to get started?</h2>
        <p className="mt-2 text-gray-600">Create your free account and launch your first campaign in minutes.</p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link href="/signup" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
            Start for Free
          </Link>
          <Link href="/pricing" className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-gray-50">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}

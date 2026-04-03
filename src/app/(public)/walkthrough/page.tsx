import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform Walkthrough",
  description:
    "Step-by-step guide to setting up your first referral campaign on Referrals.com.",
  openGraph: {
    title: "Platform Walkthrough | Referrals.com",
    description:
      "Step-by-step guide to setting up your first referral campaign on Referrals.com.",
    url: "https://referrals.com/walkthrough",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Platform Walkthrough | Referrals.com",
    description:
      "Step-by-step guide to setting up your first referral campaign on Referrals.com.",
  },
};

const walkthroughSteps = [
  {
    step: 1,
    title: "Create Your Account",
    description:
      "Sign up for a free account at Referrals.com. You will need your name, email, and the website URL for your first brand.",
  },
  {
    step: 2,
    title: "Add Your Brand",
    description:
      "After signing up, add your brand by entering your website URL. We will automatically fetch your site details and logo. You can manage multiple brands from one account.",
  },
  {
    step: 3,
    title: "Create a Campaign",
    description:
      "Navigate to your brand and click Create Campaign. Choose your campaign type, set a name, and configure your referral goals (visits, signups, or shares).",
  },
  {
    step: 4,
    title: "Customize Your Widget",
    description:
      "Pick a widget template and customize it with your brand colors, images, and copy. Preview it in real time. Choose between an embed widget or a popup.",
  },
  {
    step: 5,
    title: "Set Up Rewards",
    description:
      "Define what participants earn when they refer others. Options include coupon codes, custom messages, redirect URLs, or cash rewards.",
  },
  {
    step: 6,
    title: "Embed on Your Site",
    description:
      "Copy the one-line embed code and paste it into your website. The widget will appear immediately and start collecting referrals.",
  },
  {
    step: 7,
    title: "Monitor Your Dashboard",
    description:
      "Track participants, shares, clicks, and conversions in real time from your dashboard. Use the analytics to optimize your campaign.",
  },
  {
    step: 8,
    title: "Reward Your Referrers",
    description:
      "Rewards are distributed automatically when participants hit your goals. You can also manually trigger rewards or export participant data for custom fulfillment.",
  },
];

export default function WalkthroughPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Platform Walkthrough
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Follow these steps to set up your first referral campaign from start to
          finish.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {walkthroughSteps.map((item) => (
          <div key={item.step} className="flex gap-6 rounded-lg border p-6">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {item.step}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h2>
              <p className="mt-2 text-gray-600">{item.description}</p>
              {/* Screenshot placeholder */}
              <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                Screenshot placeholder &mdash; Step {item.step}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">Ready to get started?</p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Your Account
        </Link>
      </div>
    </div>
  );
}

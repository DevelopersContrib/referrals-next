import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Create a campaign, embed a widget, track referrals, and reward your participants. Set up free, publish for $9/mo, and start rewarding referrals.",
  alternates: { canonical: "https://www.referrals.com/how-it-works" },
  openGraph: {
    title: "How It Works | Referrals.com",
    description:
      "Create a campaign, embed a widget, track referrals, and reward your participants. Set up free, publish for $9/mo, and start rewarding referrals.",
    url: "https://www.referrals.com/how-it-works",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "How It Works | Referrals.com",
    description:
      "Create a campaign, embed a widget, track referrals, and reward your participants. Set up free, publish for $9/mo, and start rewarding referrals.",
  },
};

const steps = [
  {
    number: "1",
    title: "Create a Campaign",
    description:
      "Sign up, add your brand, and create a referral campaign in minutes. Customize your widget with your branding, set up reward rules, and define your goals. Choose from pre-built templates or design your own.",
    features: [
      "Pick from multiple widget templates",
      "Set reward triggers (signups, shares, visits)",
      "Customize colors, copy, and images",
    ],
  },
  {
    number: "2",
    title: "Publish for $9/mo",
    description:
      "Setting up is free and stays private while you edit. When the reward and the page look right, publish your brand for $9/mo (or $99/yr) and the campaign goes public. Cancel anytime and it goes back to private.",
    features: [
      "Preview everything before you pay",
      "Every feature included, no tiers",
      "Pay per brand, cancel anytime",
    ],
  },
  {
    number: "3",
    title: "Share Your Widget",
    description:
      "Embed the referral widget on your website with a single line of code. Your visitors can join the campaign, share your brand on social media, and invite friends via email, all from the widget.",
    features: [
      "One-line embed code for any website",
      "Social sharing to Facebook, Twitter, LinkedIn, and more",
      "Email invitations with built-in tracking",
    ],
  },
  {
    number: "4",
    title: "Track & Reward",
    description:
      "Watch referrals roll in from your dashboard. Track every share, click, and conversion in real time. Automatically reward participants when they hit your goals with coupons, cash, or custom incentives.",
    features: [
      "Real-time analytics dashboard",
      "Automatic reward distribution",
      "Leaderboard and contest features",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          How It Works
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Launch a referral program in four simple steps.
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              {step.number}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {step.title}
              </h2>
              <p className="mt-2 text-gray-600">{step.description}</p>
              <ul className="mt-4 space-y-2">
                {step.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-lg bg-brand px-8 py-3 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

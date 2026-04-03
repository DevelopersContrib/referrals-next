import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to create a referral campaign, share your widget, and track rewards with Referrals.com.",
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
    number: "3",
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
          Launch a referral program in three simple steps.
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
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}

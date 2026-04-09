import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Referral Marketing Services | Referrals.com",
  description:
    "Browse our referral marketing services including reviews, social sharing, backlinks, video reviews, and more. Affordable per-action pricing.",
  openGraph: {
    title: "Referral Marketing Services | Referrals.com",
    description:
      "Browse our referral marketing services with affordable per-action pricing.",
  },
};

const SERVICES = [
  {
    title: "Post Comment / Review",
    description:
      "Get authentic comments and reviews posted on your product or service pages to build social proof and trust.",
    price: "$0.10",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
        />
      </svg>
    ),
  },
  {
    title: "Refer & Contribute",
    description:
      "Leverage your community to refer new users and contributors to your platform with tracked referral links.",
    price: "$0.25",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
  {
    title: "Add Back Links",
    description:
      "Build quality backlinks to improve your SEO rankings and drive organic traffic to your website.",
    price: "$0.11",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
    ),
  },
  {
    title: "Functionality Check",
    description:
      "Have real users test your website or app functionality and provide detailed feedback on user experience.",
    price: "$1.23",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z"
        />
      </svg>
    ),
  },
  {
    title: "Share to Social",
    description:
      "Amplify your reach by having participants share your campaigns across social media platforms.",
    price: "$0.25",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      </svg>
    ),
  },
  {
    title: "Create Video Review",
    description:
      "Get authentic video reviews and testimonials created by real users to supercharge your marketing.",
    price: "$0.51",
    icon: (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Referral Marketing Services
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          Affordable per-action pricing to grow your brand through referrals,
          social sharing, reviews, and more.
        </p>
      </div>

      {/* Services Grid */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <div
            key={service.title}
            className="group rounded-2xl border border-white/10 bg-[#292A2D] p-6 transition-all hover:border-[#FF5C62]/30 hover:shadow-lg hover:shadow-[#FF5C62]/5"
          >
            <div className="mb-4 inline-flex rounded-xl bg-[#FF5C62]/10 p-3 text-[#FF5C62]">
              {service.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {service.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {service.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-[#FF5C62]/10 px-3 py-1 text-sm font-semibold text-[#FF5C62]">
                {service.price}
                <span className="ml-1 text-xs font-normal text-gray-400">
                  / action
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
        <p className="mt-2 text-gray-400">
          Create your first referral campaign in minutes.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-[#FF5C62] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/5"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}

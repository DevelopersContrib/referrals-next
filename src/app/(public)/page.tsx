import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Referrals.com — The Best Referral Marketing Platform",
  description:
    "Create powerful referral campaigns, embed widgets, reward participants, and grow your business through word-of-mouth marketing.",
  openGraph: {
    title: "Referrals.com — The Best Referral Marketing Platform",
    description:
      "Create powerful referral campaigns, embed widgets, reward participants, and grow your business through word-of-mouth marketing.",
    url: "https://referrals.com",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Referrals.com — The Best Referral Marketing Platform",
    description:
      "Create powerful referral campaigns, embed widgets, reward participants, and grow your business through word-of-mouth marketing.",
  },
};

const campaignTemplates = [
  {
    title: "Social Rewards",
    badge: "Free",
    description:
      "Reward users for sharing your brand on social media. Boost followers and engagement organically.",
    iconColor: "text-[#ff646c]",
    bgColor: "bg-[#ff646c]/10",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
  },
  {
    title: "Invite for Perks",
    badge: "Free",
    description:
      "Let users invite friends and earn perks. Drive sign-ups with a simple invite-and-reward loop.",
    iconColor: "text-[#926efb]",
    bgColor: "bg-[#926efb]/10",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Gamification Based",
    badge: "Premium",
    description:
      "Create leaderboards, challenges and point systems. Turn referrals into a competitive game.",
    iconColor: "text-[#ff646c]",
    bgColor: "bg-[#ff646c]/10",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-6.624V2.721" />
      </svg>
    ),
  },
  {
    title: "Voting Campaign",
    badge: "Premium",
    description:
      "Run polls and voting contests. Engage audiences and collect valuable market insights.",
    iconColor: "text-[#926efb]",
    bgColor: "bg-[#926efb]/10",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Drive Engagement",
    description: "Boost leads, increase sales, and amplify your brand reach through referral-driven engagement.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: "User-Friendly",
    description: "Simple, intuitive interface designed for quick setup. Launch your first campaign in minutes.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    title: "Broad Compatibility",
    description: "Supports WordPress, Shopify, PHP, HTML and more. Works with any website or platform.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  {
    title: "Efficient Marketing",
    description: "Reduce customer acquisition costs while increasing your online presence and conversions.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Reliable Performance",
    description: "99.99% uptime guarantee with enterprise-grade infrastructure and global CDN delivery.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Comprehensive Integration",
    description: "Syncs with Google Analytics, Facebook Pixel, MailChimp, Zapier and 5,000+ apps.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Data Compliance",
    description: "Fully GDPR compliant with built-in consent management and data protection features.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: "Unlimited Potential",
    description: "Launch campaigns across 10 domains with unlimited participants and referral tracking.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
  },
  {
    title: "Ready-Made Templates",
    description: "Access high-quality referral templates to launch campaigns quickly without design skills.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Dedicated Support",
    description: "Step-by-step guides, knowledgebase articles, and responsive support when you need it.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    title: "Exclusive Market Access",
    description: "Feature deals and promotions to our growing network of 500k+ active subscribers.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Charwin Arbuleche",
    role: "Founder, Photostream",
    quote:
      "Photostream needed a way to increase signups. Referrals.com turned out to be one of the best referral campaign builders we have used.",
    avatar: "CA",
  },
  {
    name: "Jack Paton",
    role: "CEO, LaunchPad",
    quote:
      "We used it for our new platform and it skyrocketted our new users to 300%!",
    avatar: "JP",
  },
  {
    name: "Maai Floirendo",
    role: "Marketing Lead",
    quote: "In just 3 days, our signups increased 500x!",
    avatar: "MF",
  },
];

const integrations = [
  "WordPress",
  "Shopify",
  "Google Analytics",
  "Facebook Pixel",
  "Zapier",
  "MailChimp",
];

export default function HomePage() {
  return (
    <div>
      {/* Section 1 - Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#212529] via-[#1a1d21] to-[#212529] py-24 sm:py-32">
        {/* Decorative gradient orbs */}
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#ff646c]/5 blur-3xl" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-[#926efb]/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ff646c]/30 bg-[#ff646c]/10 px-4 py-1.5 text-sm font-medium text-[#ff646c]">
            Refer, Reward, Grow
          </span>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Skyrocket your
            <br />
            <span className="bg-gradient-to-r from-[#ff646c] to-[#926efb] bg-clip-text text-transparent">
              network today
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Where Your Network Becomes Your Net Worth. Unlock crypto rewards,
            create website partnerships and experience growth like never before.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-xl bg-[#ff646c] px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-[#ff646c]/25 transition-all hover:bg-[#ff4f58] hover:shadow-xl hover:shadow-[#ff646c]/30"
            >
              Start trial!
            </Link>
            <Link
              href="/signup"
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              or sign-up free
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="text-xs text-gray-500">Sign in with</span>
            {/* Google */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
            {/* Facebook */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
              <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            {/* Twitter/X */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2 - Campaign Templates */}
      <section className="bg-[#212529] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Flexible Campaigns
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Choose from multiple campaign types to match your growth strategy
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {campaignTemplates.map((template) => (
              <div
                key={template.title}
                className="group rounded-xl border border-white/5 bg-[#292A2D] p-6 transition-all hover:border-white/10 hover:shadow-lg hover:shadow-black/20"
              >
                <div className={`mb-4 inline-flex rounded-lg p-3 ${template.bgColor}`}>
                  <span className={template.iconColor}>{template.icon}</span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {template.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      template.badge === "Free"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-[#926efb]/10 text-[#926efb]"
                    }`}
                  >
                    {template.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 - Features */}
      <section className="bg-[#1a1d21] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Powerful Features to Amplify
              <br className="hidden sm:block" /> Your Online Presence
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Everything you need to launch, manage, and scale referral programs
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/5 bg-[#292A2D] p-6 transition-all hover:border-white/10"
              >
                <div className="mb-4 inline-flex rounded-lg bg-[#926efb]/10 p-2.5 text-[#926efb]">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Testimonials */}
      <section className="bg-[#212529] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Trusted by businesses worldwide to drive referral growth
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-white/5 bg-[#292A2D] p-6"
              >
                <div className="mb-4 flex text-[#ff646c]">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff646c] to-[#926efb] text-sm font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 - Pricing */}
      <section className="bg-[#1a1d21] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Choose the plan that fits your growth stage
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* Pioneer Plan */}
            <div className="rounded-2xl border border-white/10 bg-[#292A2D] p-8">
              <h3 className="text-xl font-semibold text-white">Pioneer Plan</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$299</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited Domains",
                  "Unlimited Campaigns",
                  "Unlimited Brands",
                  "GDPR Compliant",
                  "Priority Support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="h-5 w-5 flex-shrink-0 text-[#ff646c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-[#ff646c] px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#ff646c]/25"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="relative rounded-2xl border border-[#926efb]/30 bg-[#292A2D] p-8">
              <span className="absolute -top-3 right-6 rounded-full bg-[#926efb] px-3 py-1 text-xs font-semibold text-white">
                Popular
              </span>
              <h3 className="text-xl font-semibold text-white">
                Premium (Grow)
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-gray-400">/Brand</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "Lead Generation",
                  "Social Followers Growth",
                  "Sales & Conversions",
                  "Gamification Features",
                  "Advanced Analytics",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="h-5 w-5 flex-shrink-0 text-[#926efb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-[#926efb] px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#7c5ce0] hover:shadow-lg hover:shadow-[#926efb]/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - Integrations */}
      <section className="bg-[#212529] py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Works with your favorite tools
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Seamlessly integrate with the platforms you already use
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {integrations.map((name) => (
              <div
                key={name}
                className="flex h-16 items-center rounded-xl border border-white/5 bg-[#292A2D] px-8 text-sm font-medium text-gray-300 transition-colors hover:border-white/10 hover:text-white"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 - Final CTA */}
      <section className="bg-gradient-to-r from-[#ff646c] to-[#ff4f58] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to skyrocket your growth?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join thousands of businesses using Referrals.com to drive
            word-of-mouth growth.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
  openGraph: {
    title: "About Us | Referrals.com",
    description:
      "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
    url: "https://referrals.com/about",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Us | Referrals.com",
    description:
      "Learn about Referrals.com — the all-in-one referral marketing platform helping businesses grow through word-of-mouth.",
  },
};

const values = [
  {
    title: "Easy Setup",
    description:
      "Launch a referral campaign in under five minutes with no coding required. Our intuitive dashboard guides you every step.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Analytics",
    description:
      "Monitor shares, clicks, and conversions with a live dashboard. Data-driven decisions made simple.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Flexible Rewards",
    description:
      "Offer coupons, cash, crypto tokens, or custom rewards. Match your incentive strategy to your brand.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Global Reach",
    description:
      "Support for multiple languages and currencies. Reach audiences worldwide with localized campaigns.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: "Enterprise Ready",
    description:
      "White-label solutions, SSO, dedicated support, and custom SLAs for large organizations.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Secure & Compliant",
    description:
      "GDPR compliant with enterprise-grade security, data encryption, and privacy-first architecture.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#212529]">
      {/* Hero */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              About Referrals.com
            </h1>
            <p className="mt-6 text-lg text-gray-400">
              We help businesses unlock the power of word-of-mouth marketing
              through simple, effective referral campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#1a1d21] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Referrals.com was built with one goal: make it easy for any
              business to launch and manage a referral program. Whether you are a
              solo founder or a growing enterprise, our platform gives you the
              tools to turn satisfied customers into your most effective
              marketing channel.
            </p>

            <h2 className="mt-12 text-2xl font-bold text-white">
              What We Do
            </h2>
            <ul className="mt-4 space-y-4">
              {[
                "Provide embeddable referral widgets you can add to any website in minutes.",
                "Track every share, click, and signup so you know exactly what is working.",
                "Automate rewards with coupons, cash payouts, crypto tokens, or custom incentives.",
                "Integrate with the tools you already use through our REST API and Zapier.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-gray-400">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ff646c]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-2xl font-bold text-white">Our Story</h2>
            <p className="mt-4 text-gray-400 leading-relaxed">
              Founded by marketers and developers who saw firsthand how powerful
              referrals can be, Referrals.com started as a simple widget builder
              and grew into a full-featured referral marketing platform trusted
              by thousands of businesses worldwide. We believe growth should be
              accessible to everyone, not just companies with big marketing
              budgets.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-white">
            Why Choose Us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
            Built for growth, designed for simplicity
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, idx) => (
              <div
                key={value.title}
                className="rounded-xl border border-white/5 bg-[#292A2D] p-6 transition-all hover:border-white/10"
              >
                <div
                  className={`mb-4 inline-flex rounded-lg p-2.5 ${
                    idx % 2 === 0
                      ? "bg-[#ff646c]/10 text-[#ff646c]"
                      : "bg-[#926efb]/10 text-[#926efb]"
                  }`}
                >
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1a1d21] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { stat: "500K+", label: "Active Subscribers" },
              { stat: "10K+", label: "Campaigns Launched" },
              { stat: "99.99%", label: "Uptime Guarantee" },
              { stat: "150+", label: "Countries Served" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-4xl font-bold text-[#ff646c]">{item.stat}</p>
                <p className="mt-2 text-sm text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#ff646c] to-[#ff4f58] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Join thousands of growing businesses
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Start your referral program today and experience growth like never
            before.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  WhitelabelEmailWidgetStrip,
  WhitelabelGoLivePipeline,
  WhitelabelHeroMockup,
  WhitelabelSurfacesMockup,
} from "@/components/marketing/whitelabel-showcase";

export const metadata: Metadata = {
  title: "Whitelabel Referral Platform",
  description:
    "Run referral programs under your own brand. Custom domains, subdomains, and full branding control with Referrals.com whitelabel solution.",
  openGraph: {
    title: "Whitelabel | Referrals.com",
    description: "Fully branded referral platform under your own domain.",
    url: "https://referrals.com/whitelabel",
  },
};

const features = [
  {
    title: "Custom domain",
    desc: "Point refer.yourbrand.com (or any hostname) with a simple CNAME. Visitors never leave your trust zone.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
      </svg>
    ),
  },
  {
    title: "Instant subdomain",
    desc: "yourbrand.referrals.com works immediately while DNS propagates — perfect for demos and pilot programs.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    title: "Branded emails",
    desc: "Invites, rewards, and campaign messages use your voice, logo, and sending identity — no generic footers.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: "Widget theming",
    desc: "Embeds inherit your palette, typography, and CTA copy with live preview before you publish anywhere.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    title: "Branded landing pages",
    desc: "Public campaign and referral pages load on your hostname with your chrome — no “Powered by” badges.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h19.5m-19.5 3.75h19.5m-19.5-7.5h19.5M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: "Multi-brand control",
    desc: "Agencies and portfolios run isolated brands — each with its own domain, campaigns, and analytics.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
];

export default function WhitelabelPage() {
  return (
    <div className="bg-gradient-to-b from-white via-rose-50/40 to-violet-50/30">
      <section className="public-hero relative overflow-x-hidden lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(146,110,251,0.15),transparent)]" />
        <div className="pointer-events-none absolute -right-24 top-20 hidden h-72 w-72 rounded-full bg-[#FF5C62]/10 blur-3xl sm:block" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-w-0 items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-12">
            <div className="min-w-0 text-center lg:text-left">
              <span className="inline-flex rounded-full border border-violet-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#926efb] shadow-sm backdrop-blur">
                Enterprise-grade branding
              </span>
              <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight text-gray-900 min-[380px]:text-[1.85rem] sm:mt-4 sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Whitelabel referrals that{" "}
                <span className="bg-gradient-to-r from-[#FF5C62] via-[#ff7a6f] to-[#926efb] bg-clip-text text-transparent">
                  feel 100% native
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:mt-4 sm:text-base md:text-lg lg:mx-0">
                Your domain, your emails, your widgets, your story — powered by Referrals.com
                under the hood. No co-branding noise on customer-facing surfaces.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3 lg:justify-start">
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:bg-[#ff4f58]"
                >
                  Start whitelabel trial
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  View pricing
                </Link>
                <Link
                  href="/features"
                  className="text-sm font-semibold text-[#926efb] underline-offset-4 hover:underline"
                >
                  Explore features
                </Link>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <WhitelabelHeroMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-rose-100/60 bg-white/60 py-10">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 text-center text-sm font-medium text-gray-500 sm:text-base">
          <span className="text-gray-800">Your logo in-app</span>
          <span className="hidden text-gray-200 sm:inline" aria-hidden>
            |
          </span>
          <span>Custom TLS hostname</span>
          <span className="hidden text-gray-200 sm:inline" aria-hidden>
            |
          </span>
          <span>No “powered by” on customer pages</span>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <WhitelabelGoLivePipeline />
        </div>
      </section>

      <section className="bg-gradient-to-b from-white to-rose-50/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <WhitelabelSurfacesMockup />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#926efb]">
              Touchpoints
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your brand touches, you control
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From first impression to reward email — one consistent experience for referrers
              and friends.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-rose-100/80 bg-white p-6 shadow-md transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${
                    i % 2 === 0
                      ? "bg-rose-50 text-[#FF5C62]"
                      : "bg-violet-50 text-[#926efb]"
                  }`}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rose-100/60 bg-gradient-to-b from-violet-50/20 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Email &amp; embeds that match your design system
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Shimmer previews show how polished your comms and on-site widgets can look out of
              the box.
            </p>
          </div>
          <div className="mt-14">
            <WhitelabelEmailWidgetStrip />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#ff646c] via-[#FF5C62] to-[#926efb] py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay">
          <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Launch your branded referral platform
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Guided setup, priority support on Enterprise, and room to grow from first brand to
            full portfolio.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition hover:bg-gray-50"
            >
              Start free
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-xl border-2 border-white/45 bg-white/10 px-8 py-3.5 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

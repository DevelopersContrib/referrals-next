import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  CameraIcon,
  CoinsIcon,
  DownloadIcon,
  LockIcon,
  Maximize2Icon,
  PanelTopIcon,
  Share2Icon,
  SparklesIcon,
  ArrowRightIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Campaign Templates",
  description:
    "Explore our ready-made referral campaign templates. Social rewards, voting, gamification, and more — launch in minutes.",
  openGraph: {
    title: "Campaign Templates | Referrals.com",
    description: "Ready-made referral campaign templates.",
    url: "https://referrals.com/campaign-templates",
  },
};

type TemplateDef = {
  slug: string;
  title: string;
  desc: string;
  tag: "Free" | "Premium";
  icon: LucideIcon;
  gradient: string;
  chipClass: string;
};

const templates: TemplateDef[] = [
  {
    slug: "social-instant",
    title: "Social Instant Reward",
    desc: "Reward participants the moment they share on social. Built for fast viral loops and launch-week buzz.",
    tag: "Free",
    icon: Share2Icon,
    gradient: "from-[#FF5C62] via-[#ff7a6f] to-[#ff9a8b]",
    chipClass: "bg-[#FF5C62] text-white",
  },
  {
    slug: "token-reward",
    title: "Token Reward",
    desc: "Crypto-native incentives for Web3 communities — referrals that feel on-chain without the friction.",
    tag: "Premium",
    icon: CoinsIcon,
    gradient: "from-[#6b4bb7] via-[#926efb] to-[#b8a4fc]",
    chipClass: "bg-[#926efb] text-white",
  },
  {
    slug: "download-giveaway",
    title: "Download Giveaway",
    desc: "Ebooks, guides, or assets in exchange for qualified referrals. Perfect for lead-gen and content marketing.",
    tag: "Free",
    icon: DownloadIcon,
    gradient: "from-[#e11d48] via-[#FF5C62] to-[#fb7185]",
    chipClass: "bg-[#FF5C62] text-white",
  },
  {
    slug: "photo-voting",
    title: "Photo Voting",
    desc: "UGC contests where friends vote. High engagement and shareable moments across Instagram and beyond.",
    tag: "Premium",
    icon: CameraIcon,
    gradient: "from-[#5b21b6] via-[#7c3aed] to-[#a78bfa]",
    chipClass: "bg-[#926efb] text-white",
  },
  {
    slug: "poll-campaign",
    title: "Poll Campaign",
    desc: "Collect opinions and grow your list at the same time — every vote can carry a referral ask.",
    tag: "Free",
    icon: BarChart3Icon,
    gradient: "from-[#be123c] via-[#FF5C62] to-[#fda4af]",
    chipClass: "bg-[#FF5C62] text-white",
  },
  {
    slug: "closed-beta",
    title: "Closed Beta",
    desc: "Invite-only access with referral gates. Ideal for product-led growth before a public launch.",
    tag: "Premium",
    icon: LockIcon,
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6]",
    chipClass: "bg-[#926efb] text-white",
  },
  {
    slug: "info-bar",
    title: "Info Bar",
    desc: "A slim top bar that follows visitors site-wide — always-on promotion without blocking content.",
    tag: "Free",
    icon: PanelTopIcon,
    gradient: "from-[#9f1239] via-[#FF5C62] to-[#fecdd3]",
    chipClass: "bg-[#FF5C62] text-white",
  },
  {
    slug: "full-page",
    title: "Full Page Takeover",
    desc: "Maximum-impact landing for launches. One focused story: join, refer, unlock — highest conversion potential.",
    tag: "Premium",
    icon: Maximize2Icon,
    gradient: "from-[#3b0764] via-[#7c3aed] to-[#c4b5fd]",
    chipClass: "bg-[#926efb] text-white",
  },
];

export default function CampaignTemplatesPage() {
  return (
    <div className="min-h-screen bg-[#16171a]">
      <section className="public-hero relative overflow-x-hidden border-b border-white/10 lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(255,92,98,0.22),transparent)]" />
        <div className="relative mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#FF5C62] backdrop-blur">
            <SparklesIcon className="size-3.5" />
            Template library
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            Campaign templates that{" "}
            <span className="bg-gradient-to-r from-[#FF5C62] to-[#926efb] bg-clip-text text-transparent">
              look sharp out of the box
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-400 sm:text-base md:text-lg">
            Each pattern is tuned for a specific growth motion — pick one, customize in the builder,
            then drop the embed on your site, Shopify theme, WordPress page, or legacy CodeIgniter
            app.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Browse by use case</h2>
              <p className="mt-1 text-sm text-gray-500">
                Free templates ship with core features; Premium unlocks gamification and advanced
                flows.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#FF5C62]/40 hover:bg-[#FF5C62]/10"
            >
              Start free
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => {
              const Icon = t.icon;
              return (
                <article
                  key={t.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1e1f24] shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#FF5C62]/25 hover:shadow-[#FF5C62]/10"
                >
                  <div
                    className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${t.gradient}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] opacity-60" />
                    <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-sm transition group-hover:scale-105">
                      <Icon className="size-8" strokeWidth={1.5} />
                    </div>
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.chipClass}`}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold text-white transition group-hover:text-white">
                      {t.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">{t.desc}</p>
                    <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                      <Link
                        href={`/signup?ref=templates&tpl=${encodeURIComponent(t.slug)}`}
                        className="flex flex-1 items-center justify-center rounded-xl bg-[#FF5C62] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[#ff4f58]"
                      >
                        Use template
                      </Link>
                      <Link
                        href="/features"
                        className="flex flex-1 items-center justify-center rounded-xl border border-white/10 py-2.5 text-center text-xs font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Need something custom?</h2>
          <p className="mt-3 text-gray-400">
            Start from a template or build from scratch in the campaign wizard — then paste the
            JavaScript or iframe snippet into WordPress, Shopify, Wix, Next.js, or your PHP
            CodeIgniter layout.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF5C62] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/20"
          >
            Build a custom campaign
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

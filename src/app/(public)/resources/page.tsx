import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { useCases } from "@/lib/use-cases";

export const metadata: Metadata = {
  title: "Referral Marketing Resources & Guides | Referrals.com",
  description:
    "The complete hub for referral marketing: how referral programs work, playbooks by industry, reward strategies, and the latest guides from Referrals.com.",
  alternates: { canonical: "https://referrals.com/resources" },
  openGraph: {
    title: "Referral Marketing Resources & Guides | Referrals.com",
    description:
      "The complete hub for referral marketing: how referral programs work, playbooks by industry, reward strategies, and the latest guides.",
    url: "https://referrals.com/resources",
    siteName: "Referrals.com",
    type: "website",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
  },
};

const chapters = [
  {
    title: "What is referral marketing?",
    body: "Referral marketing turns your existing customers into advocates who bring in new customers through word of mouth. Because referred customers arrive with built-in trust, they convert higher and stay longer than customers from paid channels.",
  },
  {
    title: "How referral programs work",
    body: "A referral program gives customers a shareable link and rewards them (and often their friends) when a referral converts. The best programs use double-sided rewards, make sharing effortless, and track every share, click, and conversion.",
  },
  {
    title: "Choosing the right reward",
    body: "Cash, credits, discounts, and gamified milestones all work — the key is matching the reward to your margin and your audience. Give-get coupons suit ecommerce, account credits suit SaaS, and leaderboards suit communities.",
  },
  {
    title: "Launching and scaling",
    body: "Use your 14-day Growth trial to prove the channel, then stay free forever (capped) or keep Growth at $9/mo per brand to scale domains. Embed widgets where intent is highest — post-purchase, onboarding, and account pages.",
  },
];

export default function ResourcesPage() {
  const posts = getAllPosts().slice(0, 6);

  return (
    <div className="bg-gradient-to-b from-white via-rose-50/40 to-orange-50/30">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm">
            Referral marketing hub
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            The complete guide to referral marketing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Everything you need to plan, launch, and scale a referral program that
            actually drives growth.
          </p>
        </div>
      </section>

      {/* Pillar chapters */}
      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="grid gap-6 md:grid-cols-2">
          {chapters.map((c) => (
            <div key={c.title} className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{c.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* By industry (internal links to programmatic pages) */}
      <section className="border-y border-rose-100/60 bg-white/70 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Referral playbooks by industry
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">
            Tailored guidance for how referral programs work in your world.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <Link
                key={u.slug}
                href={`/referral-program-for/${u.slug}`}
                className="group rounded-2xl border border-rose-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#FF5C62]">
                  {u.label}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{u.subhead}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-[#926efb]">
                  Read the playbook →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest from the blog */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Latest guides
            </h2>
            <Link href="/blog" className="text-sm font-semibold text-[#926efb] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-rose-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-[#FF5C62]">
                  {post.tags?.[0] || "Guide"}
                </p>
                <h3 className="mt-2 font-semibold text-gray-900 group-hover:text-[#FF5C62]">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#ff646c] via-[#ff5c62] to-[#926efb] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Put it into practice</h2>
          <p className="mt-3 text-white/90">
            Start a 14-day Growth trial free — then stay free forever (capped) or upgrade.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition hover:bg-gray-50"
          >
            Start free trial
          </Link>
        </div>
      </section>
    </div>
  );
}

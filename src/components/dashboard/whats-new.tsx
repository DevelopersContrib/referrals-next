import Link from "next/link";
import { BookOpenIcon, MegaphoneIcon, MessageSquareIcon, RocketIcon, SparklesIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAllPosts } from "@/lib/blog";
import { announcements } from "@/lib/announcements";
import { isExcludedFromSearch } from "@/lib/seo-indexable-brands";
import { BrandLogo } from "@/components/brands/brand-logo";

type LaunchRow = {
  id: number;
  name: string | null;
  slug: string;
  domain: string | null;
  logo_url: string | null;
};

/**
 * Newest public campaigns on live brands (paid or network). Only what anyone
 * can already open at /p/...; drafts and private brands never appear.
 */
async function latestPublicLaunches(limit: number): Promise<LaunchRow[]> {
  const rows = await prisma.$queryRaw<LaunchRow[]>`
    SELECT mc.id, mc.name, mu.slug, mu.domain, mu.logo_url
    FROM member_campaigns mc
    JOIN member_urls mu ON mu.id = mc.url_id
    JOIN members m ON m.id = mu.member_id
    WHERE mc.publish = 'public'
      AND mu.slug IS NOT NULL AND mu.slug <> ''
      AND m.is_verified = 1
      AND (
        mu.in_vnoc = 1
        OR mu.vnoc_id IS NOT NULL
        OR (
          mu.plan_expiry > NOW()
          AND (
            SELECT pl.price FROM url_plan up
            JOIN plans pl ON pl.id = up.payment_id
            WHERE up.url_id = mu.id
            ORDER BY up.id DESC LIMIT 1
          ) > 0
        )
      )
    ORDER BY mc.id DESC
    LIMIT 24`;
  const seenBrands = new Set<string>();
  return rows
    .map((r) => ({ ...r, id: Number(r.id) }))
    .filter((r) => !isExcludedFromSearch(r))
    .filter((r) => {
      // One campaign per brand so a single busy brand can't fill the list.
      if (seenBrands.has(r.slug)) return false;
      seenBrands.add(r.slug);
      return true;
    })
    .slice(0, limit);
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/**
 * Dashboard "What's new": latest announcements, forum discussions and blog
 * posts, so there's something fresh every time a member logs in.
 */
export async function WhatsNew() {
  const [topics, posts, launches] = await Promise.all([
    prisma.topics
      .findMany({
        orderBy: { date_posted: "desc" },
        take: 4,
        select: { id: true, title: true, slug: true, date_posted: true },
      })
      .catch(() => []),
    Promise.resolve().then(() => {
      try {
        return getAllPosts().slice(0, 2);
      } catch {
        return [];
      }
    }),
    latestPublicLaunches(4).catch(() => []),
  ]);

  const replyCounts = topics.length
    ? await prisma.topic_comments
        .groupBy({
          by: ["topic_id"],
          where: { topic_id: { in: topics.map((t) => t.id) } },
          _count: { _all: true },
        })
        .catch(() => [])
    : [];
  const replies = new Map(replyCounts.map((r) => [r.topic_id, r._count._all]));
  const latest = announcements[0];

  return (
    <section
      aria-labelledby="whats-new-heading"
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <SparklesIcon className="size-4 text-[#7c3aed]" aria-hidden="true" />
        <h2 id="whats-new-heading" className="text-base font-semibold text-gray-900">
          What&apos;s new
        </h2>
      </div>

      {/* Latest announcement, highlighted */}
      {latest && (
        <Link
          href={latest.href}
          className="group block bg-gradient-to-r from-rose-50 to-violet-50 px-5 py-4 transition hover:from-rose-100/70 hover:to-violet-100/70"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#d63a40]">
            <MegaphoneIcon className="size-3.5" aria-hidden="true" /> New · {fmt(latest.date)}
          </p>
          <p className="mt-1 font-semibold text-gray-900">{latest.title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{latest.body}</p>
          <span className="mt-2 inline-block text-sm font-semibold text-[#d63a40] group-hover:underline">
            {latest.cta} →
          </span>
        </Link>
      )}

      {announcements.length > 1 && (
        <ul className="divide-y divide-gray-50 border-b border-gray-100">
          {announcements.slice(1, 3).map((a) => (
            <li key={a.title}>
              <Link href={a.href} className="flex items-start gap-3 px-5 py-3 transition hover:bg-gray-50">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#d63a40]" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">{a.title}</span>
                  <span className="block text-xs text-gray-500">{a.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Just launched */}
      {launches.length > 0 && (
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
            <RocketIcon className="size-3.5" aria-hidden="true" /> Just launched
          </p>
          <ul className="mt-2 space-y-1">
            {launches.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/p/${c.slug}/campaign/${c.id}`}
                  target="_blank"
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
                >
                  <BrandLogo
                    domain={c.domain || c.slug}
                    logoUrl={c.logo_url}
                    imgClassName="size-8 shrink-0 rounded-lg border bg-white object-contain p-0.5"
                    fallbackClassName="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {c.domain || c.slug}
                    </span>
                    <span className="block truncate text-xs text-gray-500">{c.name || "New campaign"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forum */}
      {topics.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <MessageSquareIcon className="size-3.5" aria-hidden="true" /> Community
            </p>
            <Link href="/forum" className="text-xs font-medium text-[#d63a40] hover:underline">
              All discussions
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {topics.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/forum/post/${t.slug || t.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 transition hover:bg-gray-50"
                >
                  <span className="min-w-0 text-sm text-gray-800">{t.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {replies.get(t.id) ? `${replies.get(t.id)} ${replies.get(t.id) === 1 ? "reply" : "replies"}` : fmt(t.date_posted)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/forum/new"
            className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-[#d63a40]/40 hover:text-[#d63a40]"
          >
            Ask the community
          </Link>
        </div>
      )}

      {/* Blog */}
      {posts.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <BookOpenIcon className="size-3.5" aria-hidden="true" /> From the blog
            </p>
            <Link href="/blog" className="text-xs font-medium text-[#d63a40] hover:underline">
              All posts
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block rounded-lg px-2 py-1.5 -mx-2 transition hover:bg-gray-50">
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-[#d63a40]">
                    {p.title}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {p.readingTime ? `${p.readingTime} · ` : ""}
                    {fmt(p.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

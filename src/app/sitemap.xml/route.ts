import { NextResponse } from "next/server";
import { getAllArticleSlugs } from "@/lib/knowledgebase-articles";
import { getAllPosts } from "@/lib/blog";
import { useCases } from "@/lib/use-cases";
import { prisma } from "@/lib/prisma";
import { getIndexableBrands } from "@/lib/seo-indexable-brands";
import { canonicalOrigin } from "@/lib/site-url";

export async function GET() {
  const baseUrl = canonicalOrigin(
    process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  );

  // Static pages
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/signin", priority: "0.6", changefreq: "monthly" },
    { url: "/signup", priority: "0.7", changefreq: "monthly" },
    { url: "/pricing", priority: "0.9", changefreq: "weekly" },
    { url: "/features", priority: "0.9", changefreq: "weekly" },
    { url: "/how-it-works", priority: "0.8", changefreq: "monthly" },
    { url: "/campaign-templates", priority: "0.8", changefreq: "weekly" },
    { url: "/whitelabel", priority: "0.7", changefreq: "monthly" },
    { url: "/partners", priority: "0.6", changefreq: "monthly" },
    { url: "/referral-program", priority: "0.5", changefreq: "monthly" },
    { url: "/walkthrough", priority: "0.6", changefreq: "monthly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "monthly" },
    { url: "/resources", priority: "0.8", changefreq: "weekly" },
    { url: "/forum", priority: "0.6", changefreq: "daily" },
    { url: "/blog", priority: "0.8", changefreq: "daily" },
    { url: "/developer", priority: "0.7", changefreq: "weekly" },
    { url: "/developer/docs", priority: "0.7", changefreq: "weekly" },
    { url: "/support", priority: "0.8", changefreq: "weekly" },
    { url: "/.well-known/agent.json", priority: "0.5", changefreq: "monthly" },
  ];

  const supportArticlePages = getAllArticleSlugs().map((slug) => ({
    url: `/support/${slug}`,
    priority: "0.6",
    changefreq: "monthly" as const,
  }));

  // Campaign template detail pages
  const templatePages = [
    "social-instant",
    "token-reward",
    "download-giveaway",
    "photo-voting",
    "poll-campaign",
    "closed-beta",
    "info-bar",
    "full-page",
  ].map((slug) => ({
    url: `/campaign-templates/${slug}`,
    priority: "0.6",
    changefreq: "monthly" as const,
  }));

  // Programmatic industry pages
  const useCasePages = useCases.map((u) => ({
    url: `/referral-program-for/${u.slug}`,
    priority: "0.7",
    changefreq: "monthly" as const,
  }));

  // Blog posts
  let blogPages: { url: string; priority: string; changefreq: "monthly" }[] = [];
  try {
    blogPages = getAllPosts().map((post) => ({
      url: `/blog/${post.slug}`,
      priority: "0.6",
      changefreq: "monthly" as const,
    }));
  } catch {
    // Continue without blog posts if content dir is unavailable
  }

  // Dynamic pages: public brand landing pages (/p/{slug}) and their public
  // campaigns. Only live brands with a public campaign are listed; private,
  // empty and excluded brands get noindex on the page itself.
  let brandUrls: { url: string; date_added: Date }[] = [];
  let campaignUrls: { url: string; date_added: Date }[] = [];
  try {
    const brands = await getIndexableBrands();
    brandUrls = brands.map((b) => ({
      url: `/p/${b.slug}`,
      date_added: b.date_added,
    }));

    const brandById = new Map(brands.map((b) => [b.id, b]));
    const campaigns =
      brands.length > 0
        ? await prisma.member_campaigns.findMany({
            select: { id: true, date_added: true, url_id: true },
            where: { publish: "public", url_id: { in: [...brandById.keys()] } },
          })
        : [];
    campaignUrls = campaigns.flatMap((c) => {
      const brand = brandById.get(c.url_id);
      if (!brand) return [];
      return [{ url: `/p/${brand.slug}/campaign/${c.id}`, date_added: c.date_added }];
    });
  } catch {
    // If DB query fails, continue with static pages only
  }

  // Dynamic pages: forum topics
  let topicUrls: { url: string; date_posted: Date }[] = [];
  try {
    const archived = await prisma.topic_categories.findMany({
      where: { is_archived: true },
      select: { id: true },
    });
    const archivedIds = archived.map((c) => c.id);
    const topics = await prisma.topics.findMany({
      select: { slug: true, date_posted: true },
      where: {
        slug: { not: null },
        status: { in: ["open", "answered"] },
        ...(archivedIds.length
          ? {
              OR: [
                { category_id: null },
                { category_id: { notIn: archivedIds } },
              ],
            }
          : {}),
      },
    });
    topicUrls = topics
      .filter((t) => t.slug)
      .map((t) => ({
        url: `/forum/post/${t.slug}`,
        date_posted: t.date_posted,
      }));
  } catch {
    // Continue
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...supportArticlePages, ...templatePages, ...useCasePages, ...blogPages]
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
${brandUrls
  .map(
    (b) => `  <url>
    <loc>${baseUrl}${b.url}</loc>
    <lastmod>${b.date_added.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
${campaignUrls
  .map(
    (c) => `  <url>
    <loc>${baseUrl}${c.url}</loc>
    <lastmod>${c.date_added.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
${topicUrls
  .map(
    (t) => `  <url>
    <loc>${baseUrl}${t.url}</loc>
    <lastmod>${t.date_posted.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

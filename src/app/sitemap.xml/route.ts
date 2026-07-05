import { NextResponse } from "next/server";
import { getAllArticleSlugs } from "@/lib/knowledgebase-articles";
import { getAllPosts } from "@/lib/blog";
import { useCases } from "@/lib/use-cases";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://referrals.com";

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
    { url: "/services", priority: "0.7", changefreq: "monthly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/contact", priority: "0.6", changefreq: "monthly" },
    { url: "/resources", priority: "0.8", changefreq: "weekly" },
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

  // Dynamic pages: public brand pages
  let brandUrls: { url: string; date_added: Date }[] = [];
  try {
    const brands = await prisma.member_urls.findMany({
      select: { slug: true, date_added: true },
      where: { slug: { not: null } },
    });
    brandUrls = brands
      .filter((b) => b.slug)
      .map((b) => ({
        url: `/brands/${b.slug}`,
        date_added: b.date_added,
      }));
  } catch {
    // If DB query fails, continue with static pages only
  }

  // Dynamic pages: public campaign pages
  let campaignUrls: { url: string; date_added: Date }[] = [];
  try {
    const campaigns = await prisma.member_campaigns.findMany({
      select: { id: true, date_added: true },
      where: { publish: "public" },
    });
    campaignUrls = campaigns.map((c) => ({
      url: `/campaigns/${c.id}`,
      date_added: c.date_added,
    }));
  } catch {
    // Continue with what we have
  }

  // Dynamic pages: forum topics
  let topicUrls: { url: string; date_posted: Date }[] = [];
  try {
    const topics = await prisma.topics.findMany({
      select: { slug: true, date_posted: true },
      where: { slug: { not: null } },
    });
    topicUrls = topics
      .filter((t) => t.slug)
      .map((t) => ({
        url: `/forum/${t.slug}`,
        date_posted: t.date_posted,
      }));
  } catch {
    // Continue
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...supportArticlePages, ...useCasePages, ...blogPages]
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

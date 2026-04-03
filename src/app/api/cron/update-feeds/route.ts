import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateCron } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all brands with URLs to fetch RSS feeds from
    const brands = await prisma.member_urls.findMany({
      where: { url: { not: "" } },
      select: { id: true, url: true, domain: true },
    });

    let feedsUpdated = 0;
    let feedsFailed = 0;

    for (const brand of brands) {
      try {
        // Try common RSS feed URLs
        const feedUrls = [
          `${brand.url}/feed`,
          `${brand.url}/rss`,
          `${brand.url}/feed.xml`,
          `${brand.url}/rss.xml`,
          `${brand.url}/blog/feed`,
        ];

        let feedXml: string | null = null;

        for (const feedUrl of feedUrls) {
          try {
            const resp = await fetch(feedUrl, {
              signal: AbortSignal.timeout(5000),
              headers: { "User-Agent": "Referrals.com Feed Bot/1.0" },
            });
            if (resp.ok) {
              const contentType = resp.headers.get("content-type") || "";
              if (
                contentType.includes("xml") ||
                contentType.includes("rss") ||
                contentType.includes("atom")
              ) {
                feedXml = await resp.text();
                break;
              }
            }
          } catch {
            // Try next URL
          }
        }

        if (!feedXml) continue;

        // Basic XML parsing for RSS items
        const items: { title: string; description: string; link: string; image?: string }[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;

        while ((match = itemRegex.exec(feedXml)) !== null) {
          const itemXml = match[1];
          const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ||
            itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const description =
            itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>/s)?.[1] ||
            itemXml.match(/<description>(.*?)<\/description>/s)?.[1] || "";
          const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
          const mediaMatch = itemXml.match(/<media:content[^>]*url="([^"]*)"/);
          const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]*)"/);
          const image = (mediaMatch ? mediaMatch[1] : null) ||
            (enclosureMatch ? enclosureMatch[1] : null) || undefined;

          if (title && link) {
            items.push({ title: title.trim(), description: description.trim(), link: link.trim(), image });
          }

          if (items.length >= 10) break;
        }

        // Upsert feed items
        for (const item of items) {
          const existing = await prisma.feeds.findFirst({
            where: { link: item.link },
          });

          if (!existing) {
            await prisma.feeds.create({
              data: {
                title: item.title.substring(0, 200),
                description: item.description.substring(0, 5000) || null,
                link: item.link.substring(0, 200),
                from: brand.id,
                image: item.image?.substring(0, 200) || null,
                date_added: new Date(),
              },
            });
          }
        }

        if (items.length > 0) feedsUpdated++;
      } catch (err) {
        console.error(`Failed to update feed for brand ${brand.id}:`, err);
        feedsFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      brands_checked: brands.length,
      feeds_updated: feedsUpdated,
      feeds_failed: feedsFailed,
    });
  } catch (error) {
    console.error("Update feeds cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

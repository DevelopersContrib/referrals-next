import { NextResponse } from "next/server";
import { networkPagePath, networkSiteByKey, networkSiteUrl } from "@/lib/network-sites";

/** sitemap.xml for a clone host: only its own pages. */
export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = networkSiteByKey((await params).site);
  if (!site) return new NextResponse("Not found", { status: 404 });
  const urls = site.pages
    .map((p) => `  <url><loc>${networkSiteUrl(site, networkPagePath(p))}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}

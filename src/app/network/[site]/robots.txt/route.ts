import { NextResponse } from "next/server";
import { networkSiteByKey, networkSiteUrl } from "@/lib/network-sites";

/** robots.txt for a clone host (the proxy rewrites /robots.txt here). */
export async function GET(_req: Request, { params }: { params: Promise<{ site: string }> }) {
  const site = networkSiteByKey((await params).site);
  if (!site) return new NextResponse("Not found", { status: 404 });
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${networkSiteUrl(site, "/sitemap.xml")}\n`;
  return new NextResponse(body, { headers: { "Content-Type": "text/plain" } });
}

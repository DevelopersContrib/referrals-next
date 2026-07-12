import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/domain-brand";
import { resolveTargetCampaign } from "@/lib/domain-referrer";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/**
 * GET /api/brand?domain=<domain>
 *
 * Domain → referral config resolver. Lets a Cloudflare lander worker (or any
 * site) self-configure: given its own hostname it gets back the campaign id,
 * public page, widget loader, and refer-link API. Public + cacheable.
 */
export async function GET(request: NextRequest) {
  const root = (process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com").replace(/\/$/, "");
  const domain = normalizeDomain(new URL(request.url).searchParams.get("domain") || "");

  if (!domain) {
    return NextResponse.json({ error: "domain param is required" }, { status: 400, headers: cors });
  }

  const target = await resolveTargetCampaign(domain);
  if (!target) {
    return NextResponse.json(
      { in_network: false, domain },
      { status: 200, headers: { ...cors, "Cache-Control": "public, s-maxage=3600" } }
    );
  }

  const { brand, campaign } = target;
  const slug = brand.slug || String(brand.id);

  return NextResponse.json(
    {
      in_network: true,
      domain,
      brandId: brand.id,
      campaignId: campaign.id,
      slug,
      pageUrl: `${root}/p/${slug}`,
      campaignUrl: `${root}/p/${slug}/campaign/${campaign.id}`,
      widgetUrl: `${root}/widget.js?campaign=${campaign.id}`,
      referApi: `${root}/api/domain-refer?from=${domain}&to=TARGET-DOMAIN.com`,
    },
    { status: 200, headers: { ...cors, "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}

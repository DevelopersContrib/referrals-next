import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleCors } from "@/lib/api/helpers";
import { normalizeDomain } from "@/lib/domain-brand";

function networkKeyMatches(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    if (!networkKeyMatches(req.headers.get("x-api-key"), process.env.NETWORK_READ_KEY)) {
      return apiError("Invalid or missing network key", 401);
    }
    const domain = normalizeDomain(new URL(req.url).searchParams.get("domain") || "");
    if (!domain) return apiError("domain query is required", 400);

    // VNOC-only: the brand must exist AND have a vnoc_id.
    const brand = await prisma.member_urls.findFirst({
      where: {
        NOT: { vnoc_id: null },
        OR: [{ domain }, { domain: `www.${domain}` }],
      },
      orderBy: { date_added: "desc" },
    });
    if (!brand) return apiSuccess({ found: false, domain }); // not a VNOC referral brand

    const campaigns = await prisma.member_campaigns.findMany({
      where: { url_id: brand.id },
      orderBy: { date_added: "desc" },
    });

    const visits = campaigns.reduce((n, c) => n + (c.num_visits ?? 0), 0);
    const signups = campaigns.reduce((n, c) => n + (c.num_signups ?? 0), 0);

    return apiSuccess({
      found: true,
      domain,
      vnoc_id: brand.vnoc_id,
      brand: {
        id: brand.id,
        url: brand.url,
        domain: brand.domain,
        referral_campaign_id: brand.referral_campaign_id,
      },
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        publish: c.publish,
        reward_type: c.reward_type,
        visits: c.num_visits ?? 0,
        signups: c.num_signups ?? 0,
        is_primary: c.id === brand.referral_campaign_id,
      })),
      totals: { campaigns: campaigns.length, visits, signups },
    });
  } catch (error) {
    console.error("[v1.network.referrals] failed:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST() {
  return apiError("Method not allowed", 405);
}
export async function PUT() {
  return apiError("Method not allowed", 405);
}
export async function DELETE() {
  return apiError("Method not allowed", 405);
}

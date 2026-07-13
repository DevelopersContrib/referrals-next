import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDomain } from "@/lib/domain-brand";
import { getOrCreateDomainReferrer } from "@/lib/domain-referrer";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * /api/click — whole-domain referral click beacon.
 *
 * Loaded by `referral.js` on every network site. When a visitor clicks an
 * outbound link on `from` (e.g. garagechannel.com) toward another brand `to`
 * (e.g. handyman.com), the script beacons here. We resolve `from` to ITS OWN
 * referral campaign, get-or-create its domain-referrer participant, and log a
 * click against that campaign's `participants_share` row — so the click shows
 * on the referring brand's dashboard. Attribution on signup still rides on the
 * `?ref=<from>` the script appends to the outbound link (closed by the
 * destination brand's bridge). No new tables.
 *
 * Accepts params via query string (sendBeacon URL / image pixel) or JSON body.
 * Fails open — a tracking beacon must never break the user's navigation.
 */
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const FALLBACK_CAMPAIGN = Number(process.env.REFERRALS_SIGNUP_CAMPAIGN || 77);
const SOCIAL_TYPE = 1; // matches the `:1:` share code minted by getOrCreateDomainReferrer

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/** The referring domain earns in ITS OWN campaign; fall back to the platform signup campaign. */
async function resolveReferrerCampaign(fromDomain: string): Promise<number> {
  const brand = await prisma.member_urls.findFirst({
    where: { domain: fromDomain },
    select: { id: true, referral_campaign_id: true },
  });
  if (!brand) return FALLBACK_CAMPAIGN;
  if (brand.referral_campaign_id) return brand.referral_campaign_id;
  const own = await prisma.member_campaigns.findFirst({
    where: { url_id: brand.id, publish: "public" },
    orderBy: { date_added: "desc" },
    select: { id: true },
  });
  return own?.id || FALLBACK_CAMPAIGN;
}

async function record(from: string, to: string, url: string) {
  const referrer = normalizeDomain(from);
  if (!referrer) return { ok: false as const, reason: "no-referrer" };

  const campaignId = await resolveReferrerCampaign(referrer);
  const { participantId } = await getOrCreateDomainReferrer(referrer, campaignId);

  // Ensure a share row exists (updateMany-increment is a no-op without one), then bump clicks.
  const existing = await prisma.participants_share.findFirst({
    where: { campaign_id: campaignId, participant_id: participantId, social_type: SOCIAL_TYPE },
    select: { id: true },
  });
  if (existing) {
    await prisma.participants_share.update({
      where: { id: existing.id },
      data: { clicks: { increment: 1 } },
    });
  } else {
    await prisma.participants_share.create({
      data: {
        campaign_id: campaignId,
        participant_id: participantId,
        social_type: SOCIAL_TYPE,
        clicks: 1,
        url: (url || `https://${normalizeDomain(to) || referrer}`).slice(0, 200),
      },
    });
  }

  return { ok: true as const, campaignId, participantId, to: normalizeDomain(to) || null };
}

async function run(request: NextRequest, from: string, to: string, url: string) {
  if (!rateLimit(`click:${clientIp(request)}`, 200, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429, headers: cors });
  }
  try {
    return NextResponse.json(await record(from, to, url), { headers: cors });
  } catch (error) {
    console.error("[api/click] error:", error);
    // Fail open: never surface an error to a navigating user's beacon.
    return NextResponse.json({ ok: false }, { status: 200, headers: cors });
  }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  return run(request, sp.get("from") || "", sp.get("to") || "", sp.get("url") || "");
}

export async function POST(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  let from = sp.get("from") || "";
  let to = sp.get("to") || "";
  let url = sp.get("url") || "";
  if (!from) {
    try {
      const b = (await request.json()) as Record<string, unknown>;
      from = String(b.from ?? "");
      to = String(b.to ?? "");
      url = String(b.url ?? "");
    } catch {
      /* no/invalid body — query params only */
    }
  }
  return run(request, from, to, url);
}

import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/domain-brand";
import {
  getOrCreateDomainReferrer,
  resolveTargetCampaign,
} from "@/lib/domain-referrer";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/**
 * GET /api/domain-refer?from=<domain>&to=<domain>
 *
 * Mint a domain-to-domain referral link: domain `from` refers domain `to`.
 * Lazily registers `from` as a referrer in `to`'s campaign and returns the
 * stateless /t tracking link. When a visitor who clicks it becomes a lead on
 * `to`, `from` earns the campaign's $5 token reward (existing reward flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = normalizeDomain(searchParams.get("from") || "");
  const to = normalizeDomain(searchParams.get("to") || "");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both `from` and `to` domain params are required." },
      { status: 400, headers: cors }
    );
  }
  if (from === to) {
    return NextResponse.json(
      { error: "`from` and `to` must be different domains." },
      { status: 400, headers: cors }
    );
  }

  const target = await resolveTargetCampaign(to);
  if (!target) {
    return NextResponse.json(
      { in_network: false, error: `${to} has no active referral campaign.` },
      { status: 404, headers: cors }
    );
  }

  const link = await getOrCreateDomainReferrer(from, target.campaign.id);
  return NextResponse.json(
    {
      in_network: true,
      from,
      to,
      campaignId: link.campaignId,
      participantId: link.participantId,
      url: link.url,
    },
    { headers: cors }
  );
}

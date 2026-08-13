import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { prisma } from "@/lib/prisma";
import {
  enrollSegmentIntoCampaign,
  HY_DOMAIN_KEY,
} from "@/lib/engagement";
import {
  formatEnrollSuccessMessage,
  normalizeEnrollLimit,
  normalizeSpreadDays,
  validateLargeAudienceConfirm,
} from "@/lib/engagement-enroll-guards";
import { getSegmentByKey, parseRulesFromJson, countSegmentMembers } from "@/lib/engagement-segments";

/**
 * POST /api/admin/engagement/enroll-segment
 * Enroll members of a campaign’s linked segment (or explicit segmentKey).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    campaignKey?: string;
    segmentKey?: string;
    limit?: number;
    spreadDays?: number;
    confirmEnroll?: string;
  };

  if (!body.campaignKey?.trim()) {
    return NextResponse.json({ ok: false, error: "campaignKey is required" }, { status: 400 });
  }

  const campaignKey = body.campaignKey.trim();
  const limit = normalizeEnrollLimit(body.limit);
  const spreadDays = normalizeSpreadDays(body.spreadDays);

  try {
    const campaign = await prisma.engagement_campaigns.findUnique({
      where: {
        domain_key_campaign_key: {
          domain_key: HY_DOMAIN_KEY,
          campaign_key: campaignKey,
        },
      },
    });
    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    const segmentKey = (body.segmentKey?.trim() || campaign.segment_key || "").trim();
    if (!segmentKey) {
      return NextResponse.json(
        { ok: false, error: "Campaign has no segment — link one first." },
        { status: 400 }
      );
    }

    const seg = await getSegmentByKey(segmentKey);
    if (!seg) {
      return NextResponse.json({ ok: false, error: "Segment not found" }, { status: 404 });
    }

    const memberCount = await countSegmentMembers(parseRulesFromJson(seg.rules_json));
    const confirmErr = validateLargeAudienceConfirm(memberCount, body.confirmEnroll);
    if (confirmErr) {
      return NextResponse.json({ ok: false, error: confirmErr }, { status: 400 });
    }

    const result = await enrollSegmentIntoCampaign({
      campaignKey,
      segmentKey,
      limit,
      spreadDays,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      memberCount,
      message: formatEnrollSuccessMessage(result),
    });
  } catch (e) {
    console.error("[admin/engagement/enroll-segment]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Enroll failed" },
      { status: 400 }
    );
  }
}

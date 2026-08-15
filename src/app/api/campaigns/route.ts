import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";
import { sanitizeWidgetSettings } from "@/lib/widget-settings";
import {
  isMemberGrowthEntitled,
  subscriptionRequiredResponse,
} from "@/lib/member-subscription";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  const where: Record<string, unknown> = { member_id: memberId };
  if (brandId) {
    where.url_id = parseInt(brandId, 10);
  }

  try {
    const campaigns = await prisma.member_campaigns.findMany({
      where,
      orderBy: { date_added: "desc" },
    });

    // Get participant counts for each campaign
    const campaignIds = campaigns.map((c) => c.id);
    const participantCounts = await prisma.campaign_participants.groupBy({
      by: ["campaign_id"],
      where: { campaign_id: { in: campaignIds } },
      _count: { id: true },
    });

    const countMap = new Map(
      participantCounts.map((p) => [p.campaign_id, p._count.id])
    );

    // Get campaign types
    const typeIds = [...new Set(campaigns.map((c) => c.type_id))];
    const types = await prisma.campaign_types.findMany({
      where: { id: { in: typeIds } },
    });
    const typeMap = new Map(types.map((t) => [t.id, t.name]));

    const result = campaigns.map((c) => ({
      ...c,
      participantCount: countMap.get(c.id) || 0,
      typeName: typeMap.get(c.type_id) || "Unknown",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const {
      name,
      type_id,
      url_id,
      goal_type,
      num_visits,
      num_signups,
      reward_type,
      reward_notify_subject,
      reward_notify_message,
      campaign_entry_subject,
      campaign_entry_message,
      publish,
      widget_description,
      widget_button_text,
      body_text,
      banner_image_url,
      widget_color,
      widget_button_color,
      reward,
      coupons,
      widget: widgetInput,
    } = body;

    if (!name || !type_id || !url_id) {
      return NextResponse.json(
        { error: "Name, type, and brand are required" },
        { status: 400 }
      );
    }

    // Verify brand ownership
    const brand = await prisma.member_urls.findFirst({
      where: { id: parseInt(url_id, 10), member_id: memberId },
    });
    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found or not owned by you" },
        { status: 403 }
      );
    }

    const paid = await isMemberGrowthEntitled(memberId);
    const resolvedPublish =
      publish === "public" || publish === "private"
        ? publish
        : paid
          ? "public"
          : "private";
    if (resolvedPublish === "public" && !paid) {
      return subscriptionRequiredResponse();
    }

    const campaign = await prisma.member_campaigns.create({
      data: {
        name,
        type_id: parseInt(type_id, 10),
        url_id: parseInt(url_id, 10),
        member_id: memberId,
        reward_type: parseInt(reward_type, 10) || 1,
        goal_type: goal_type || "signup",
        num_visits: num_visits ? parseInt(num_visits, 10) : null,
        num_signups: num_signups ? parseInt(num_signups, 10) : null,
        reward_notify_subject: reward_notify_subject || null,
        reward_notify_message: reward_notify_message || null,
        campaign_entry_subject: campaign_entry_subject || null,
        campaign_entry_message: campaign_entry_message || null,
        publish: resolvedPublish,
        date_added: new Date(),
      },
    });

    const safeBody = body_text ? sanitizeWidgetHtml(String(body_text)) : null;
    const bannerUrl =
      typeof banner_image_url === "string" && banner_image_url.trim()
        ? String(banner_image_url).trim().slice(0, 4_000_000)
        : null;
    const desc =
      typeof widget_description === "string" && widget_description.trim()
        ? String(widget_description).trim().slice(0, 65000)
        : `Join ${name} and earn rewards!`;
    const btn =
      typeof widget_button_text === "string" && widget_button_text.trim()
        ? String(widget_button_text).trim().slice(0, 100)
        : "Join Now";
    const col = /^[0-9A-Fa-f]{6}$/.test(String(widget_color || ""))
      ? String(widget_color)
      : "6366f1";
    const btnCol = /^[0-9A-Fa-f]{6}$/.test(String(widget_button_color || ""))
      ? String(widget_button_color)
      : col;

    // Preset (use-case) widget settings win over the defaults derived above.
    const presetWidget = sanitizeWidgetSettings(widgetInput);
    await prisma.campaign_widget.create({
      data: {
        campaign_id: campaign.id,
        header_title: name,
        description: desc,
        button_text: btn,
        color: col.replace("#", ""),
        button_color: btnCol.replace("#", ""),
        body_text: safeBody || null,
        banner_image_url: bannerUrl,
        ...presetWidget,
      },
    });

    const rewardData: {
      campaign_id: number;
      redirect_url?: string | null;
      custom_message?: string | null;
      cash_value?: number;
      worth_value?: number | null;
      token_symbol?: string | null;
      token_address?: string | null;
      token_amount?: string | null;
    } = { campaign_id: campaign.id };

    if (reward && typeof reward === "object") {
      if (typeof reward.redirect_url === "string" && reward.redirect_url.trim()) {
        rewardData.redirect_url = reward.redirect_url.trim().slice(0, 100);
      }
      if (typeof reward.custom_message === "string" && reward.custom_message.trim()) {
        rewardData.custom_message = reward.custom_message.trim();
      }
      if (reward.cash_value != null && reward.cash_value !== "") {
        const cash = parseFloat(String(reward.cash_value));
        if (Number.isFinite(cash)) rewardData.cash_value = cash;
      }
      if (reward.worth_value != null && reward.worth_value !== "") {
        const worth = parseFloat(String(reward.worth_value));
        if (Number.isFinite(worth)) rewardData.worth_value = worth;
      }
      if (typeof reward.token_symbol === "string" && reward.token_symbol.trim()) {
        rewardData.token_symbol = reward.token_symbol.trim().slice(0, 100);
      }
      if (typeof reward.token_address === "string" && reward.token_address.trim()) {
        rewardData.token_address = reward.token_address.trim().slice(0, 100);
      }
      if (typeof reward.token_amount === "string" && reward.token_amount.trim()) {
        rewardData.token_amount = reward.token_amount.trim().slice(0, 100);
      }
    }

    await prisma.campaign_reward.create({ data: rewardData });

    if (coupons && Array.isArray(coupons) && coupons.length > 0) {
      const couponData = coupons
        .map((code: unknown) => String(code).trim())
        .filter(Boolean)
        .map((code: string) => ({
          campaign_id: campaign.id,
          code: code.slice(0, 100),
          is_used: false,
        }));
      if (couponData.length > 0) {
        await prisma.campaign_coupons.createMany({ data: couponData });
      }
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

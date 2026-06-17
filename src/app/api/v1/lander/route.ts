import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApiKey,
  apiSuccess,
  apiError,
  handleCors,
} from "@/lib/api/helpers";
import { logApiCall } from "@/lib/api/log-call";

export async function OPTIONS() {
  return handleCors();
}

export async function GET(req: NextRequest) {
  try {
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return apiError("Invalid or missing API key", 401);
    }

    const apiKey = req.headers.get("x-api-key") || "";
    const url = new URL(req.url);
    const campaignId = parseInt(url.searchParams.get("campaign_id") || "0", 10);

    if (!campaignId) {
      return apiError("campaign_id is required", 400);
    }

    logApiCall(apiKey, "v1/lander", req);

    const lander = await prisma.campaign_lander.findFirst({
      where: { campaign_id: campaignId },
    });

    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: campaignId },
      select: { name: true, url_id: true },
    });

    if (!campaign) {
      return apiError("Campaign not found", 404);
    }

    const brand = await prisma.member_urls.findFirst({
      where: { id: campaign.url_id },
      select: {
        id: true,
        logo_url: true,
        background_image: true,
        domain: true,
      },
    });

    const socials = brand
      ? await prisma.url_socials.findMany({
          where: { url_id: brand.id },
          select: { social: true, profile_url: true },
        })
      : [];

    const socialMap: Record<string, string> = {};
    for (const s of socials) {
      socialMap[`${s.social}_url`] = s.profile_url;
    }

    if (lander) {
      return apiSuccess({
        lander: `lander_${lander.template_id}`,
        header_title: lander.header_title,
        header_description: lander.header_description,
        footer_title: lander.footer_title,
        footer_description: lander.footer_description,
        background_type: lander.background_type,
        background_color: lander.background_color,
        background_image: lander.background_image,
        font_color: lander.font_color,
        brand_background_image: brand?.background_image || null,
        brand_logo_url: brand?.logo_url || null,
        brand_domain: brand?.domain || null,
        campaign_name: campaign.name,
        ...socialMap,
      });
    }

    return apiSuccess({
      lander: "default",
      background_image: brand?.background_image || null,
      brand_logo_url: brand?.logo_url || null,
      brand_domain: brand?.domain || null,
      campaign_name: campaign.name,
      ...socialMap,
    });
  } catch (error) {
    console.error("Lander GET error:", error);
    return apiError("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId query param is required" },
        { status: 400 }
      );
    }

    const lander = await prisma.campaign_lander.findFirst({
      where: { campaign_id: parseInt(campaignId, 10) },
    });

    if (!lander) {
      return NextResponse.json({
        lander: null,
        message: "No lander configuration found for this campaign",
      });
    }

    return NextResponse.json({
      lander: {
        id: lander.id,
        campaignId: lander.campaign_id,
        templateId: lander.template_id,
        headerTitle: lander.header_title,
        headerDescription: lander.header_description,
        footerTitle: lander.footer_title,
        footerDescription: lander.footer_description,
        backgroundType: lander.background_type,
        backgroundColor: lander.background_color,
        backgroundImage: lander.background_image,
        fontColor: lander.font_color,
      },
    });
  } catch (error) {
    console.error("Lander GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const body = await request.json();

    const {
      campaignId,
      templateId,
      headline,
      description,
      footerTitle,
      footerDescription,
      bgColor,
      accentColor,
      textColor,
      bgImageUrl,
      backgroundType,
      buttonText,
    } = body;

    // If campaignId is provided, save to a specific campaign lander
    if (campaignId) {
      // Verify ownership
      const campaign = await prisma.member_campaigns.findFirst({
        where: { id: parseInt(campaignId, 10), member_id: memberId },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found or access denied" },
          { status: 404 }
        );
      }

      const existing = await prisma.campaign_lander.findFirst({
        where: { campaign_id: parseInt(campaignId, 10) },
      });

      if (existing) {
        const updated = await prisma.campaign_lander.update({
          where: { id: existing.id },
          data: {
            template_id: templateId || existing.template_id,
            header_title: headline || existing.header_title,
            header_description: description || existing.header_description,
            footer_title: footerTitle || existing.footer_title,
            footer_description: footerDescription || existing.footer_description,
            background_type: backgroundType || existing.background_type,
            background_color: bgColor || existing.background_color,
            background_image: bgImageUrl || existing.background_image,
            font_color: textColor || existing.font_color,
          },
        });
        return NextResponse.json({ lander: updated });
      }

      const lander = await prisma.campaign_lander.create({
        data: {
          campaign_id: parseInt(campaignId, 10),
          template_id: templateId || 1,
          header_title: headline || null,
          header_description: description || null,
          footer_title: footerTitle || null,
          footer_description: footerDescription || null,
          background_type: backgroundType || "color",
          background_color: bgColor || "#212529",
          background_image: bgImageUrl || null,
          font_color: textColor || "#FFFFFF",
        },
      });

      return NextResponse.json({ lander }, { status: 201 });
    }

    // Save to lander preview (no specific campaign)
    const preview = await prisma.campaign_lander_preview.create({
      data: {
        campaign_id: 0,
        template_id: templateId || 1,
        header_title: headline || null,
        header_description: description || null,
        footer_title: footerTitle || null,
        footer_description: footerDescription || null,
        background_type: backgroundType || "color",
        background_color: bgColor || "#212529",
        background_image: bgImageUrl || null,
        font_color: textColor || "#FFFFFF",
      },
    });

    return NextResponse.json({ lander: preview }, { status: 201 });
  } catch (error) {
    console.error("Lander POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

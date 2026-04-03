import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/api/helpers";

/**
 * Handle Zapier webhook triggers.
 * When Zapier fires a trigger, this endpoint processes it.
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate via API key
    const memberId = await authenticateApiKey(req);
    if (!memberId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event, campaign_id, data } = body;

    if (!event) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Process different event types
    switch (event) {
      case "subscribe": {
        // Zapier subscribe action: register a webhook URL
        const { hookUrl } = body;
        if (!hookUrl) {
          return NextResponse.json(
            { error: "hookUrl is required for subscribe" },
            { status: 400 }
          );
        }

        const webhook = await prisma.member_zapier.create({
          data: {
            member_id: memberId,
            link: hookUrl,
            campaign_id: campaign_id || null,
            message: "Zapier automation",
          },
        });

        return NextResponse.json({ id: webhook.id });
      }

      case "unsubscribe": {
        // Zapier unsubscribe action: remove a webhook URL
        const { id } = body;
        if (!id) {
          return NextResponse.json(
            { error: "Webhook id is required for unsubscribe" },
            { status: 400 }
          );
        }

        await prisma.member_zapier.deleteMany({
          where: { id: parseInt(id, 10), member_id: memberId },
        });

        return NextResponse.json({ success: true });
      }

      case "add_participant": {
        // Zapier action: add a participant to a campaign
        if (!campaign_id || !data?.email || !data?.name) {
          return NextResponse.json(
            { error: "campaign_id, data.email, and data.name are required" },
            { status: 400 }
          );
        }

        // Verify campaign ownership
        const campaign = await prisma.member_campaigns.findFirst({
          where: { id: campaign_id, member_id: memberId },
        });

        if (!campaign) {
          return NextResponse.json(
            { error: "Campaign not found" },
            { status: 404 }
          );
        }

        // Check for duplicate
        const existing = await prisma.campaign_participants.findFirst({
          where: { campaign_id, email: data.email },
        });

        if (existing) {
          return NextResponse.json({
            success: true,
            participant: existing,
            message: "Participant already exists",
          });
        }

        const participant = await prisma.campaign_participants.create({
          data: {
            campaign_id,
            email: data.email,
            name: data.name,
            date_signedup: new Date(),
          },
        });

        return NextResponse.json({ success: true, participant });
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Zapier webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

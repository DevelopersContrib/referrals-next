import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptShareCode } from "@/lib/encryption";
import { sendEmail } from "@/lib/ses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/widget/invite
 *
 * Send email invites from a participant.
 * Body: { campaignId, participantId, emails: string[] }
 * Records invited emails and sends invites via AWS SES.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, participantId, emails } = body;

    if (!campaignId || !participantId || !emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "campaignId, participantId, and emails[] are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate - max 10 emails per request
    const validEmails = emails
      .filter((e: string) => typeof e === "string" && e.includes("@"))
      .slice(0, 10);

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get campaign and participant info
    const [campaign, participant, widget, emailContent] = await Promise.all([
      prisma.member_campaigns.findUnique({ where: { id: campaignId } }),
      prisma.campaign_participants.findFirst({
        where: { id: participantId, campaign_id: campaignId },
      }),
      prisma.campaign_widget.findFirst({ where: { campaign_id: campaignId } }),
      prisma.campaign_email_content.findFirst({
        where: { campaign_id: campaignId },
      }),
    ]);

    if (!campaign || !participant) {
      return NextResponse.json(
        { error: "Campaign or participant not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
    const sent: string[] = [];
    const failed: string[] = [];

    for (const email of validEmails) {
      try {
        // Record the invited email
        const invitedRecord =
          await prisma.participants_invited_emails.create({
            data: {
              participant_id: participantId,
              campaign_id: campaignId,
              name: email.split("@")[0],
              email: email.toLowerCase().trim(),
            },
          });

        // Generate tracking share link with invited email ID
        const shareCode = encryptShareCode(
          `${campaignId}:4:${participantId}:${invitedRecord.id}`
        );
        const inviteUrl = `${appUrl}/t/${shareCode}`;

        // Build email content
        const subject =
          emailContent?.subject ||
          `${participant.name} invited you to ${campaign.name}`;

        const htmlBody =
          emailContent?.template
            ?.replace(/\{invite_url\}/g, inviteUrl)
            .replace(/\{referrer_name\}/g, participant.name)
            .replace(/\{campaign_name\}/g, campaign.name) ||
          buildDefaultInviteEmail(
            participant.name,
            campaign.name,
            widget?.header_title || campaign.name,
            widget?.description || "",
            inviteUrl
          );

        await sendEmail({
          to: email.toLowerCase().trim(),
          subject,
          html: htmlBody,
          fromName: "Referrals.com",
        });

        sent.push(email);
      } catch (emailError) {
        console.error(`[widget/invite] Failed to send to ${email}:`, emailError);
        failed.push(email);
      }
    }

    return NextResponse.json(
      {
        success: true,
        sent: sent.length,
        failed: failed.length,
        sentEmails: sent,
        failedEmails: failed,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[widget/invite] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

function buildDefaultInviteEmail(
  referrerName: string,
  campaignName: string,
  headerTitle: string,
  description: string,
  inviteUrl: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1F2937; margin-bottom: 8px;">${headerTitle}</h2>
      ${description ? `<p style="color: #6B7280; margin-bottom: 16px;">${description}</p>` : ""}
      <p style="color: #374151; line-height: 1.6;">
        <strong>${referrerName}</strong> thought you'd be interested in <strong>${campaignName}</strong> and sent you this invite.
      </p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
          Join Now
        </a>
      </p>
      <p style="font-size: 12px; color: #9CA3AF;">
        Powered by <a href="https://referrals.com" style="color: #9CA3AF;">Referrals.com</a>
      </p>
    </div>
  `;
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { authenticateCron } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find members with plan_expiry within the next 7 days
    const expiringMembers = await prisma.members.findMany({
      where: {
        plan_expiry: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    });

    let emailsSent = 0;

    for (const member of expiringMembers) {
      const daysLeft = Math.ceil(
        (member.plan_expiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      try {
        await sendEmail({
          to: member.email,
          subject: `Your Referrals.com plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          fromName: "Referrals.com",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Plan Expiry Reminder</h2>
              <p>Hi ${member.name},</p>
              <p>Your Referrals.com subscription plan will expire in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> on ${member.plan_expiry!.toLocaleDateString()}.</p>
              <p>To continue using all features without interruption, please renew your plan:</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                  Renew Plan
                </a>
              </p>
              <p>If you have any questions, reply to this email.</p>
            </div>
          `,
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send expiry email to ${member.email}:`, emailErr);
      }
    }

    // Also check member_urls plan expiry
    const expiringUrls = await prisma.member_urls.findMany({
      where: {
        plan_expiry: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    });

    for (const url of expiringUrls) {
      const member = await prisma.members.findUnique({
        where: { id: url.member_id },
      });

      if (!member) continue;

      const daysLeft = Math.ceil(
        (url.plan_expiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      try {
        await sendEmail({
          to: member.email,
          subject: `Brand plan for ${url.domain} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          fromName: "Referrals.com",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Brand Plan Expiry Reminder</h2>
              <p>Hi ${member.name},</p>
              <p>The plan for your brand <strong>${url.domain}</strong> expires in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                  Renew Plan
                </a>
              </p>
            </div>
          `,
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send URL expiry email to ${member.email}:`, emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      expiring_members: expiringMembers.length,
      expiring_urls: expiringUrls.length,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error("Plan expiry cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

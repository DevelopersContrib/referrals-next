import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { authenticateCron } from "@/lib/api/helpers";
import { DEFAULT_PAID_PLAN_ID, TRIAL_PLAN_ID } from "@/lib/billing-constants";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
    const upgradeUrl = `${appUrl}/billing/plan/${DEFAULT_PAID_PLAN_ID}`;

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

      const plan = member.plan_id
        ? await prisma.plans.findUnique({
            where: { id: member.plan_id },
            select: { price: true, name: true },
          })
        : null;
      const isTrial =
        !plan ||
        (plan.price ?? 0) <= 0 ||
        (member.plan_id != null && member.plan_id <= TRIAL_PLAN_ID);

      const subject = isTrial
        ? `Your Growth trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
        : `Your Referrals.com plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

      const html = isTrial
        ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Growth trial ending soon</h2>
              <p>Hi ${member.name},</p>
              <p>Your <strong>14-day Growth trial</strong> ends in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> (${member.plan_expiry!.toLocaleDateString()}).</p>
              <p>After that your widget <strong>keeps working</strong> on free forever — with caps (1 domain, 500 participants, Referrals.com branding). You’ll lose leaderboards, multi-domain, advanced analytics, and branding removal.</p>
              <p>
                <a href="${upgradeUrl}"
                   style="display: inline-block; padding: 12px 24px; background-color: #FF5C62; color: white; text-decoration: none; border-radius: 6px;">
                  Keep Growth — $9/mo per brand
                </a>
              </p>
              <p style="color:#666;font-size:13px;">No credit card was required for the trial. Upgrade anytime from Billing.</p>
            </div>
          `
        : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Plan Expiry Reminder</h2>
              <p>Hi ${member.name},</p>
              <p>Your Referrals.com subscription will expire in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> on ${member.plan_expiry!.toLocaleDateString()}.</p>
              <p>Renew to keep Growth features (no branding, multi-domain, advanced analytics):</p>
              <p>
                <a href="${upgradeUrl}"
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                  Renew / upgrade
                </a>
              </p>
            </div>
          `;

      try {
        await sendEmail({
          to: member.email,
          subject,
          fromName: "Referrals.com",
          html,
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send expiry email to ${member.email}:`, emailErr);
      }
    }

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
                <a href="${upgradeUrl}"
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

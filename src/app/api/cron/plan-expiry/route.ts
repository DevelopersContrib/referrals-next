import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { authenticateCron } from "@/lib/api/helpers";
import {
  DEFAULT_PAID_PLAN_ID,
  TRIAL_PLAN_ID,
} from "@/lib/billing-constants";
import {
  getPrimaryCheckoutBrand,
  isVnocBrand,
} from "@/lib/member-subscription";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

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
        (member.plan_expiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
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

      const checkoutBrand = isTrial
        ? await getPrimaryCheckoutBrand(member.id)
        : null;
      const brandQuery = checkoutBrand ? `?brandId=${checkoutBrand.id}` : "";
      const upgradeUrl = `${appUrl}/billing/plan/${DEFAULT_PAID_PLAN_ID}${brandQuery}`;
      const brandLabel = checkoutBrand?.domain ?? "your brand";

      const subject = isTrial
        ? `Your Growth trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
        : `Your Referrals.com plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

      const html = isTrial
        ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Growth trial ending soon</h2>
              <p>Hi ${member.name},</p>
              <p>Your <strong>14-day Growth trial</strong> ends in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> (${member.plan_expiry!.toLocaleDateString()}).</p>
              <p>Pay <strong>$9/mo for ${brandLabel}</strong> to keep Growth on that brand — remove branding, unlock analytics, and add more domains.</p>
              <p>Your live widget keeps working for visitors with Referrals.com branding on. Without payment, that brand moves to unpaid (not a free plan).</p>
              <p>
                <a href="${upgradeUrl}"
                   style="display: inline-block; padding: 12px 24px; background-color: #FF5C62; color: white; text-decoration: none; border-radius: 6px;">
                  Keep ${brandLabel} — $9/mo
                </a>
              </p>
              <p style="color:#666;font-size:13px;">VNOC / network domains stay free. No credit card was required for the trial.</p>
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
      select: {
        id: true,
        domain: true,
        member_id: true,
        plan_expiry: true,
        in_vnoc: true,
        vnoc_id: true,
      },
    });

    for (const url of expiringUrls) {
      if (isVnocBrand(url)) continue;

      const member = await prisma.members.findUnique({
        where: { id: url.member_id },
      });

      if (!member) continue;

      const daysLeft = Math.ceil(
        (url.plan_expiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const brandUpgradeUrl = `${appUrl}/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${url.id}`;

      try {
        await sendEmail({
          to: member.email,
          subject: `Keep ${url.domain} — plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          fromName: "Referrals.com",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Brand plan expiring</h2>
              <p>Hi ${member.name},</p>
              <p>Growth for <strong>${url.domain}</strong> expires in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
              <p>Renew to keep branding off and full analytics for this brand.</p>
              <p>
                <a href="${brandUpgradeUrl}"
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                  Keep ${url.domain} — renew
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

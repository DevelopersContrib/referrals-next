/**
 * B8 — Follow-up email series for unpaid brand owners.
 *
 * Steps: day0, day1, day3, day7 (time-based), abandoned (after checkout abandonment).
 * Safety: the job is a no-op unless UNPAID_FOLLOWUP_EMAILS_ENABLED=true.
 */

import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/ses";
import {
  BRAND_MONTHLY_PLAN_ID,
  PLAN_PUBLIC_NAME,
} from "@/lib/billing-constants";
import { buildBrandedEngagementEmail } from "@/lib/engagement-email-templates";

function isPrismaMissingTableOrColumn(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FollowupStep = "day0" | "day1" | "day3" | "day7" | "abandoned";

export interface FollowupCandidate {
  memberId: number;
  memberName: string;
  memberEmail: string;
  brandId: number;
  brandDomain: string;
  step: FollowupStep;
}

export interface FollowupResult {
  dryRun: boolean;
  evaluated: number;
  sent: number;
  skipped: number;
  errors: number;
  details: {
    memberId: number;
    brandId: number;
    step: FollowupStep;
    action: "sent" | "skipped" | "error" | "dry_run";
    reason?: string;
  }[];
}

// ─── Email copy ──────────────────────────────────────────────────────────────

function checkoutUrl(brandId: number, planId: number = BRAND_MONTHLY_PLAN_ID): string {
  return `{{siteUrl}}/billing/plan/${planId}?brandId=${brandId}`;
}

interface EmailDraft {
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
}

export function getFollowupEmailDraft(
  step: FollowupStep,
  brandDomain: string,
  brandId: number,
): EmailDraft {
  const planName = PLAN_PUBLIC_NAME[BRAND_MONTHLY_PLAN_ID] ?? "Brand, monthly";
  const href = checkoutUrl(brandId);

  switch (step) {
    case "day0":
      return {
        subject: `{{firstname}}, publish ${brandDomain} and start getting signups`,
        heading: `${brandDomain} is set up — make it live`,
        bodyHtml: [
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Hi {{firstname}} — you created <strong>${brandDomain}</strong> on Referrals.com. Right now it's private, so nobody can join your referral program.</p>`,
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Publish it for <strong>$9/mo</strong> (${planName}) and your campaigns go live immediately. Cancel anytime.</p>`,
        ].join(""),
        ctaLabel: `Publish ${brandDomain} — $9/mo →`,
        ctaHref: href,
      };
    case "day1":
      return {
        subject: `Quick reminder: ${brandDomain} is still private`,
        heading: "Your brand is waiting",
        bodyHtml: [
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Hi {{firstname}} — just a quick note: <strong>${brandDomain}</strong> is still set to private on Referrals.com.</p>`,
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Publish for <strong>$9/mo</strong> and people can start signing up for your referral program today.</p>`,
        ].join(""),
        ctaLabel: `Publish ${brandDomain} →`,
        ctaHref: href,
      };
    case "day3":
      return {
        subject: `${brandDomain} — ready when you are`,
        heading: "Your referral program is ready to go",
        bodyHtml: [
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Hi {{firstname}} — everything is set up for <strong>${brandDomain}</strong>. The only thing left is to publish.</p>`,
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Once you do, your campaigns, widgets, and referral links go live. <strong>$9/mo</strong>, cancel anytime.</p>`,
          `<p style="margin:0 0 12px;padding:14px;background:#fff5f5;border:1px solid #ffe4e6;border-radius:10px;font-size:15px;line-height:1.55;color:#44403c;"><strong style="color:#ff646c;">Tip</strong><br/>Most brand owners publish within 48 hours of setting up. Your competitors aren't waiting.</p>`,
        ].join(""),
        ctaLabel: `Go live — $9/mo →`,
        ctaHref: href,
      };
    case "day7":
      return {
        subject: `Last check-in: ${brandDomain} is still unpublished`,
        heading: "One week in — still private",
        bodyHtml: [
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Hi {{firstname}} — it's been about a week since you created <strong>${brandDomain}</strong>. It's still private, which means nobody can join your referral program yet.</p>`,
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">We'll stop emailing you about this, but the offer stands: <strong>$9/mo</strong> to publish, cancel anytime.</p>`,
        ].join(""),
        ctaLabel: `Publish ${brandDomain} →`,
        ctaHref: href,
      };
    case "abandoned":
      return {
        subject: `You didn't finish checking out for ${brandDomain}`,
        heading: "Pick up where you left off",
        bodyHtml: [
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">Hi {{firstname}} — it looks like you started checking out for <strong>${brandDomain}</strong> but didn't finish.</p>`,
          `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">No worries — your brand is saved and ready. Publish for <strong>$9/mo</strong> whenever you're ready.</p>`,
        ].join(""),
        ctaLabel: `Complete checkout →`,
        ctaHref: href,
      };
  }
}

// ─── Step selection ──────────────────────────────────────────────────────────

const TIME_STEPS: { step: FollowupStep; minAgeDays: number }[] = [
  { step: "day0", minAgeDays: 0 },
  { step: "day1", minAgeDays: 1 },
  { step: "day3", minAgeDays: 3 },
  { step: "day7", minAgeDays: 7 },
];

export function pickTimeStep(brandCreatedAt: Date, now: Date): FollowupStep | null {
  const ageDays = (now.getTime() - brandCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  let best: FollowupStep | null = null;
  for (const { step, minAgeDays } of TIME_STEPS) {
    if (ageDays >= minAgeDays) best = step;
  }
  return best;
}

// ─── Feature flag ────────────────────────────────────────────────────────────

export function isFollowupEnabled(): boolean {
  return process.env.UNPAID_FOLLOWUP_EMAILS_ENABLED === "true";
}

// ─── Core logic ──────────────────────────────────────────────────────────────

type FollowupPrisma = Pick<
  PrismaClient,
  "member_urls" | "members" | "url_plan" | "billing_checkout_attempts" | "unpaid_followup_sends"
>;

/**
 * Find unpaid, non-VNOC brands whose owner hasn't received a given step yet.
 * Excludes brands that have an active url_plan row.
 */
async function findUnpaidBrands(
  prisma: FollowupPrisma,
): Promise<
  {
    brandId: number;
    brandDomain: string;
    brandCreatedAt: Date;
    memberId: number;
    memberName: string;
    memberEmail: string;
  }[]
> {
  const brands = await prisma.member_urls.findMany({
    where: {
      in_vnoc: { not: true },
      vnoc_id: { equals: null },
    },
    select: {
      id: true,
      domain: true,
      member_id: true,
      date_added: true,
    },
  });

  const paidBrandIds = new Set(
    (
      await prisma.url_plan.findMany({
        select: { url_id: true },
      })
    ).map((r) => r.url_id),
  );

  const unpaid = brands.filter((b) => !paidBrandIds.has(b.id));

  const memberIds = [...new Set(unpaid.map((b) => b.member_id))];
  const members = await prisma.members.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return unpaid
    .map((b) => {
      const m = memberMap.get(b.member_id);
      if (!m || !m.email) return null;
      return {
        brandId: b.id,
        brandDomain: b.domain,
        brandCreatedAt: b.date_added,
        memberId: m.id,
        memberName: m.name || "there",
        memberEmail: m.email,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

async function findAbandonedCheckoutBrands(
  prisma: FollowupPrisma,
): Promise<{ memberId: number; brandId: number }[]> {
  const abandoned = await prisma.billing_checkout_attempts.findMany({
    where: { status: "abandoned", brand_id: { not: null } },
    select: { member_id: true, brand_id: true },
    distinct: ["member_id", "brand_id"],
  });
  return abandoned
    .filter((a): a is typeof a & { brand_id: number } => a.brand_id != null)
    .map((a) => ({ memberId: a.member_id, brandId: a.brand_id }));
}

async function alreadySent(
  prisma: FollowupPrisma,
  memberId: number,
  brandId: number,
  step: FollowupStep,
): Promise<boolean> {
  try {
    const count = await prisma.unpaid_followup_sends.count({
      where: { member_id: memberId, brand_id: brandId, step },
    });
    return count > 0;
  } catch (err: unknown) {
    if (isPrismaMissingTableOrColumn(err)) {
      console.warn(`[unpaid-followup] unpaid_followup_sends table/column missing — skipping dedup check`);
      return false;
    }
    throw err;
  }
}

async function recordSend(
  prisma: FollowupPrisma,
  memberId: number,
  brandId: number,
  step: FollowupStep,
  dryRun: boolean,
): Promise<void> {
  try {
    await prisma.unpaid_followup_sends.create({
      data: {
        member_id: memberId,
        brand_id: brandId,
        step,
        dry_run: dryRun,
      },
    });
  } catch (err: unknown) {
    if (isPrismaMissingTableOrColumn(err)) {
      console.warn(`[unpaid-followup] unpaid_followup_sends table/column missing — skipping record`);
      return;
    }
    throw err;
  }
}

function renderEmail(
  draft: EmailDraft,
  firstName: string,
  siteUrl: string,
): { subject: string; html: string } {
  const subject = draft.subject
    .replace(/\{\{firstname\}\}/g, firstName);
  const bodyHtml = draft.bodyHtml
    .replace(/\{\{firstname\}\}/g, firstName);
  const ctaHref = draft.ctaHref
    .replace(/\{\{siteUrl\}\}/g, siteUrl);

  const html = buildBrandedEngagementEmail({
    heading: draft.heading.replace(/\{\{firstname\}\}/g, firstName),
    bodyHtml: bodyHtml.replace(/\{\{siteUrl\}\}/g, siteUrl),
    ctaLabel: draft.ctaLabel,
    ctaHref,
  }).replace(/\{\{siteUrl\}\}/g, siteUrl);

  return { subject, html };
}

export async function runUnpaidFollowup(
  prisma: FollowupPrisma,
  options?: { dryRun?: boolean; now?: Date },
): Promise<FollowupResult> {
  const dryRun = options?.dryRun ?? !isFollowupEnabled();
  const now = options?.now ?? new Date();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";

  const result: FollowupResult = {
    dryRun,
    evaluated: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  const unpaidBrands = await findUnpaidBrands(prisma);

  // Time-based steps (day0, day1, day3, day7)
  for (const brand of unpaidBrands) {
    const step = pickTimeStep(brand.brandCreatedAt, now);
    if (!step) continue;

    result.evaluated++;

    if (await alreadySent(prisma, brand.memberId, brand.brandId, step)) {
      result.skipped++;
      result.details.push({
        memberId: brand.memberId,
        brandId: brand.brandId,
        step,
        action: "skipped",
        reason: "already_sent",
      });
      continue;
    }

    const draft = getFollowupEmailDraft(step, brand.brandDomain, brand.brandId);
    const firstName = brand.memberName.split(/\s/)[0] || "there";

    if (dryRun) {
      await recordSend(prisma, brand.memberId, brand.brandId, step, true);
      result.sent++;
      result.details.push({
        memberId: brand.memberId,
        brandId: brand.brandId,
        step,
        action: "dry_run",
      });
      continue;
    }

    try {
      const { subject, html } = renderEmail(draft, firstName, siteUrl);
      await sendEmail({
        to: brand.memberEmail,
        subject,
        fromName: "Referrals.com",
        html,
      });
      await recordSend(prisma, brand.memberId, brand.brandId, step, false);
      result.sent++;
      result.details.push({
        memberId: brand.memberId,
        brandId: brand.brandId,
        step,
        action: "sent",
      });
    } catch (err) {
      console.error(`[unpaid-followup] failed to send ${step} to member ${brand.memberId}:`, err);
      result.errors++;
      result.details.push({
        memberId: brand.memberId,
        brandId: brand.brandId,
        step,
        action: "error",
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  // Abandoned checkout step
  const abandonedPairs = await findAbandonedCheckoutBrands(prisma);
  const brandMap = new Map(unpaidBrands.map((b) => [`${b.memberId}:${b.brandId}`, b]));

  for (const { memberId, brandId } of abandonedPairs) {
    const brand = brandMap.get(`${memberId}:${brandId}`);
    if (!brand) continue; // brand already paid or is VNOC

    result.evaluated++;

    if (await alreadySent(prisma, memberId, brandId, "abandoned")) {
      result.skipped++;
      result.details.push({
        memberId,
        brandId,
        step: "abandoned",
        action: "skipped",
        reason: "already_sent",
      });
      continue;
    }

    const draft = getFollowupEmailDraft("abandoned", brand.brandDomain, brandId);
    const firstName = brand.memberName.split(/\s/)[0] || "there";

    if (dryRun) {
      await recordSend(prisma, memberId, brandId, "abandoned", true);
      result.sent++;
      result.details.push({ memberId, brandId, step: "abandoned", action: "dry_run" });
      continue;
    }

    try {
      const { subject, html } = renderEmail(draft, firstName, siteUrl);
      await sendEmail({
        to: brand.memberEmail,
        subject,
        fromName: "Referrals.com",
        html,
      });
      await recordSend(prisma, memberId, brandId, "abandoned", false);
      result.sent++;
      result.details.push({ memberId, brandId, step: "abandoned", action: "sent" });
    } catch (err) {
      console.error(`[unpaid-followup] abandoned email failed for member ${memberId}:`, err);
      result.errors++;
      result.details.push({
        memberId,
        brandId,
        step: "abandoned",
        action: "error",
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return result;
}

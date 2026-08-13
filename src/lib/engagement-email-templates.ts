/**
 * Starter HTML for engagement emails — editable in admin TipTap.
 * Tokens: {{firstname}}, {{siteName}}, {{siteUrl}}
 *
 * Referrals brand-manager activation = 10-email feature tour.
 */

import { completeText, aiEnabled } from "@/lib/ai";
import type { PrismaClient } from "@prisma/client";
import { RF_DOMAIN_KEY, RF_ENGAGEMENT_CAMPAIGN } from "@/lib/engagement";

const LOGO_URL = "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

export const ENGAGEMENT_EMAILS_PER_SEGMENT = 10;

export function buildBrandedEngagementEmail(opts: {
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
}): string {
  return `
<div style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
    <div style="text-align:center;padding:28px 24px 20px;background:#fff5f5;border-bottom:3px solid #ff646c;">
      <a href="{{siteUrl}}"><img src="${LOGO_URL}" alt="Referrals.com" width="180" height="auto" style="width:180px;max-width:70%;height:auto;border:0;" /></a>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1c1917;">${opts.heading}</h1>
      ${opts.bodyHtml}
      <p style="margin:24px 0 0;text-align:center;">
        <a href="${opts.ctaHref}" style="display:inline-block;background:#ff646c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">${opts.ctaLabel}</a>
      </p>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#78716c;">
        Glad you’re here,<br /><strong style="color:#1c1917;">The Referrals.com team</strong>
      </p>
    </div>
    <div style="padding:16px 28px;background:#1c1917;color:#a8a29e;font-size:12px;line-height:1.5;">
      <p style="margin:0;">
        <a href="{{siteUrl}}" style="color:#fafaf9;text-decoration:none;font-weight:700;">Referrals.com</a>
        · Referral marketing that grows with you
      </p>
      <p style="margin:8px 0 0;">
        <a href="{{siteUrl}}/dashboard" style="color:#fda4af;text-decoration:none;">Dashboard</a>
        ·
        <a href="{{siteUrl}}/account" style="color:#a8a29e;text-decoration:none;">Account</a>
      </p>
    </div>
  </div>
</div>
`.trim();
}

function tip(html: string): string {
  return `<p style="margin:0;padding:12px 14px;background:#fafaf9;border-left:4px solid #ff646c;border-radius:0 8px 8px 0;font-size:15px;line-height:1.55;color:#57534e;">${html}</p>`;
}

function p(html: string): string {
  return `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#44403c;">${html}</p>`;
}

function featureCard(title: string, body: string): string {
  return `<p style="margin:0 0 12px;padding:14px;background:#fff5f5;border:1px solid #ffe4e6;border-radius:10px;font-size:15px;line-height:1.55;color:#44403c;"><strong style="color:#ff646c;">${title}</strong><br/>${body}</p>`;
}

export type FeatureEmail = {
  stepOrder: number;
  delayDays: number;
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
};

export type WrappedDraftEmail = {
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string;
};

/** 10-email feature tour — get brand managers into each major Referrals surface. */
const FEATURE_TOUR: FeatureEmail[] = [
  {
    stepOrder: 0,
    delayDays: 0,
    subject: "{{firstname}}, welcome — your Referrals dashboard is ready",
    heading: "Start on your dashboard",
    bodyHtml: [
      p(`Hi {{firstname}} — you’re on <strong>Referrals.com</strong>. Your dashboard is home base for brands, campaigns, rewards, and growth tools.`),
      featureCard("What to open first", "Dashboard overview → Brands → create your first campaign."),
      tip("Bookmark your dashboard — every feature below links back here."),
    ].join(""),
    ctaLabel: "Open dashboard →",
    ctaHref: "{{siteUrl}}/dashboard",
  },
  {
    stepOrder: 1,
    delayDays: 1,
    subject: "Feature check: set up your brand",
    heading: "Make your brand look official",
    bodyHtml: [
      p(`A strong brand page builds trust. Add your logo, colors, and website so campaigns feel on-brand from day one.`),
      featureCard("Brand setup", "Brands → New / Edit → logo, colors, and domain. AI can suggest a color scheme from your site."),
      tip("Even a logo + two brand colors beats a blank brand."),
    ].join(""),
    ctaLabel: "Manage brands →",
    ctaHref: "{{siteUrl}}/brands",
  },
  {
    stepOrder: 2,
    delayDays: 2,
    subject: "Feature check: create a referral campaign",
    heading: "Launch with a use-case template",
    bodyHtml: [
      p(`Campaigns are the engine. Pick a use case (growth, loyalty, revenue) — we prefill rewards, copy, and widget settings.`),
      featureCard("Campaigns", "Brand → Campaigns → New. Start from a template or scratch."),
      tip("One live campaign beats five drafts. Ship something simple this week."),
    ].join(""),
    ctaLabel: "Create a campaign →",
    ctaHref: "{{siteUrl}}/brands",
  },
  {
    stepOrder: 3,
    delayDays: 3,
    subject: "Feature check: Widget Studio",
    heading: "Design a widget people want to share",
    bodyHtml: [
      p(`Widget Studio is where your referral offer looks beautiful — colors, banner, copy, and layout.`),
      featureCard("Widget", "Open a campaign → Widget. Preview live, then polish headline + images."),
      tip("Use your brand colors so the widget feels native on your site."),
    ].join(""),
    ctaLabel: "Open dashboard →",
    ctaHref: "{{siteUrl}}/dashboard",
  },
  {
    stepOrder: 4,
    delayDays: 5,
    subject: "Feature check: Integrations (embed everywhere)",
    heading: "Put the widget on your site",
    bodyHtml: [
      p(`Integrations walk you through iframe, JavaScript, Shopify, WordPress, and more — no guesswork.`),
      featureCard("Install", "Campaign → Integrations. Copy the snippet for your stack and paste it once."),
      tip("Install on your highest-traffic page first (homepage or checkout thank-you)."),
    ].join(""),
    ctaLabel: "Go to brands →",
    ctaHref: "{{siteUrl}}/brands",
  },
  {
    stepOrder: 5,
    delayDays: 7,
    subject: "Feature check: rewards & coupons",
    heading: "Make sharing worth it",
    bodyHtml: [
      p(`Rewards turn “nice idea” into action — cash, discount, points, or unique coupon codes.`),
      featureCard("Rewards", "Campaign → Rewards. Configure what advocates and friends get. Generate coupons when you need unique codes."),
      tip("Clear reward + simple claim beats a complicated multi-tier setup."),
    ].join(""),
    ctaLabel: "Open dashboard →",
    ctaHref: "{{siteUrl}}/dashboard",
  },
  {
    stepOrder: 6,
    delayDays: 9,
    subject: "Feature check: campaign emails & sharing",
    heading: "Invite advocates by email",
    bodyHtml: [
      p(`Use campaign email sequences and share tools so your best customers invite friends without you chasing them.`),
      featureCard("Emails", "Campaign → Emails. Edit subjects and body, then point people at your share link."),
      tip("Send a short invite to your warmest list first — quality over blast size."),
    ].join(""),
    ctaLabel: "Open dashboard →",
    ctaHref: "{{siteUrl}}/dashboard",
  },
  {
    stepOrder: 7,
    delayDays: 11,
    subject: "Feature check: analytics & referrals",
    heading: "See what’s converting",
    bodyHtml: [
      p(`Analytics show impressions, shares, clicks, and rewarded referrals — so you know which campaign earns its keep.`),
      featureCard("Stats", "Campaign → Analytics / Referrals. Watch which channels bring signed-up friends."),
      tip("Double down on the campaign with the best share→signup rate."),
    ].join(""),
    ctaLabel: "View stats →",
    ctaHref: "{{siteUrl}}/stats",
  },
  {
    stepOrder: 8,
    delayDays: 14,
    subject: "Feature check: your plan & billing",
    heading: "Grow when you’re ready",
    bodyHtml: [
      p(`Your <strong>Billing</strong> page shows Free vs paid plans. Upgrade when you need more brands, campaigns, or volume — stay lean until then.`),
      featureCard("Plans", "Dashboard → Billing. Compare plans anytime; cancel from the same place if you ever upgrade."),
      tip("Launch on Free, upgrade when a campaign is clearly working."),
    ].join(""),
    ctaLabel: "View billing →",
    ctaHref: "{{siteUrl}}/billing",
  },
  {
    stepOrder: 9,
    delayDays: 17,
    subject: "Feature check: Support + account",
    heading: "Help is built in",
    bodyHtml: [
      p(`Two more things: <strong>Support</strong> (we’re here) and your <strong>Account</strong> settings so notifications and profile stay current.`),
      featureCard("Support", "Use Contact / Support anytime — tickets land in our inbox with AI assist."),
      featureCard("Account", "Account settings for profile, password, and preferences."),
      tip("You’re set — keep one campaign live and check analytics weekly."),
    ].join(""),
    ctaLabel: "Open account →",
    ctaHref: "{{siteUrl}}/account",
  },
];

export const WELCOME_EMAIL_TEMPLATES: WrappedDraftEmail[] = FEATURE_TOUR.map((t) => ({
  stepOrder: t.stepOrder,
  delayDays: t.delayDays,
  subject: t.subject,
  bodyHtml: buildBrandedEngagementEmail({
    heading: t.heading,
    bodyHtml: t.bodyHtml,
    ctaLabel: t.ctaLabel,
    ctaHref: t.ctaHref,
  }),
}));

/**
 * 10 beautiful branded emails for a segment campaign.
 * Flavor tweaks subjects/intros; CTA tour stays product-complete.
 */
export function tenEmailSequenceForSegment(
  segmentName: string,
  flavor: "paid" | "new" | "active_free" | "stalled" | "generic" = "generic"
): WrappedDraftEmail[] {
  const introByFlavor: Record<typeof flavor, { subject0: string; heading0: string; body0: string }> = {
    paid: {
      subject0: "{{firstname}}, get more from your paid Referrals plan",
      heading0: "You’re on a paid plan — use the full toolkit",
      body0:
        p(`Hi {{firstname}} — thanks for being a <strong>paid Referrals</strong> member in <em>${segmentName}</em>. This 10-email tour walks every major feature so you get ROI.`) +
        featureCard("Today", "Open dashboard → brands → make sure your best campaign is live."),
    },
    new: {
      subject0: "Welcome, {{firstname}} — your first week on Referrals",
      heading0: "Your first week on Referrals",
      body0:
        p(`You’re new here (<strong>${segmentName}</strong>). Over 10 short emails we’ll tour brands, campaigns, widgets, rewards, and analytics.`) +
        featureCard("Start", "Dashboard → Brands → create or open your brand."),
    },
    active_free: {
      subject0: "{{firstname}}, you’re already running campaigns — nice",
      heading0: "Keep the momentum",
      body0:
        p(`You’re in <strong>${segmentName}</strong> — free members with campaigns live. These 10 emails sharpen widgets, rewards, embeds, and stats.`) +
        tip("Pick one campaign to polish this week."),
    },
    stalled: {
      subject0: "{{firstname}}, Referrals is ready when you are",
      heading0: "Come take another look",
      body0:
        p(`It’s been a bit since you signed up (<strong>${segmentName}</strong>). No pressure — this gentle 10-step tour restarts momentum.`) +
        tip("Even 2 minutes on the dashboard counts."),
    },
    generic: {
      subject0: `{{firstname}}, a Referrals tour for “${segmentName}”`,
      heading0: "A beautiful 10-email product tour",
      body0:
        p(`A short sequence for members in <strong>${segmentName}</strong> — edit any email anytime in Emails & AI.`) +
        tip("Open your dashboard and pick one feature to use today."),
    },
  };

  const intro = introByFlavor[flavor];
  return FEATURE_TOUR.map((t, i) => {
    const heading = i === 0 ? intro.heading0 : t.heading;
    const subject = i === 0 ? intro.subject0 : t.subject;
    const bodyInner = i === 0 ? intro.body0 + tip("You can edit or add emails anytime in Admin → Emails & AI.") : t.bodyHtml;
    return {
      stepOrder: t.stepOrder,
      delayDays: t.delayDays,
      subject,
      bodyHtml: buildBrandedEngagementEmail({
        heading,
        bodyHtml: bodyInner,
        ctaLabel: t.ctaLabel,
        ctaHref: t.ctaHref,
      }),
    };
  });
}

export function segmentFlavorFromRules(rules: {
  plan?: string;
  hasQuotes?: boolean;
  registeredWithinDays?: number;
  registeredBeforeDays?: number;
}): "paid" | "new" | "active_free" | "stalled" | "generic" {
  if (rules.plan === "paid") return "paid";
  if (typeof rules.registeredWithinDays === "number" && rules.registeredWithinDays <= 14) return "new";
  if (rules.hasQuotes === true && rules.plan !== "paid") return "active_free";
  if (typeof rules.registeredBeforeDays === "number" && rules.registeredBeforeDays >= 14) {
    return "stalled";
  }
  return "generic";
}

type EngagementStepsClient = Pick<PrismaClient, "engagement_steps">;

async function upsertActivationStep(
  prisma: EngagementStepsClient,
  step: {
    stepOrder: number;
    delayDays: number;
    subject: string;
    bodyHtml: string;
  },
  domainKey = RF_DOMAIN_KEY,
  campaignKey = RF_ENGAGEMENT_CAMPAIGN
) {
  const existing = await prisma.engagement_steps.findFirst({
    where: {
      domain_key: domainKey,
      campaign_key: campaignKey,
      step_order: step.stepOrder,
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.engagement_steps.update({
      where: { id: existing.id },
      data: {
        subject: step.subject,
        body_html: step.bodyHtml,
        delay_days: step.delayDays,
        synced_at: new Date(),
        enabled: true,
      },
    });
    return;
  }
  const rows = await prisma.engagement_steps.findMany({
    where: { domain_key: domainKey, vnoc_mail_id: { lt: 0 } },
    orderBy: { vnoc_mail_id: "asc" },
    take: 1,
    select: { vnoc_mail_id: true },
  });
  const min = rows[0]?.vnoc_mail_id ?? 0;
  const vnocMailId = min < 0 ? min - 1 : -1 - step.stepOrder;
  await prisma.engagement_steps.create({
    data: {
      domain_key: domainKey,
      campaign_key: campaignKey,
      vnoc_mail_id: vnocMailId,
      step_order: step.stepOrder,
      delay_days: step.delayDays,
      subject: step.subject,
      body_html: step.bodyHtml,
      enabled: true,
      synced_at: new Date(),
    },
  });
}

/** Upsert the 10-email feature tour onto member_activation (or any campaign). */
export async function applyWelcomeEmailTemplates(
  prisma: EngagementStepsClient,
  domainKey = RF_DOMAIN_KEY,
  campaignKey = RF_ENGAGEMENT_CAMPAIGN
) {
  let touched = 0;
  for (const t of WELCOME_EMAIL_TEMPLATES) {
    await upsertActivationStep(
      prisma,
      {
        stepOrder: t.stepOrder,
        delayDays: t.delayDays,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
      },
      domainKey,
      campaignKey
    );
    touched += 1;
  }
  return touched;
}

/**
 * Ensure a campaign has all 10 starter emails (fill missing step_orders only;
 * never overwrite edited subjects/bodies).
 */
export async function ensureTenEmailsOnCampaign(
  prisma: EngagementStepsClient,
  campaignKey: string,
  opts?: {
    domainKey?: string;
    segmentName?: string;
    flavor?: "paid" | "new" | "active_free" | "stalled" | "generic";
  }
): Promise<{ added: number; total: number }> {
  const domainKey = opts?.domainKey ?? RF_DOMAIN_KEY;
  const drafts = tenEmailSequenceForSegment(
    opts?.segmentName || "Members",
    opts?.flavor || "generic"
  );
  const existing = await prisma.engagement_steps.findMany({
    where: { domain_key: domainKey, campaign_key: campaignKey },
    select: { step_order: true },
  });
  const have = new Set(existing.map((e) => e.step_order));
  let added = 0;
  for (const d of drafts) {
    if (have.has(d.stepOrder)) continue;
    await upsertActivationStep(
      prisma,
      {
        stepOrder: d.stepOrder,
        delayDays: d.delayDays,
        subject: d.subject,
        bodyHtml: d.bodyHtml,
      },
      domainKey,
      campaignKey
    );
    added += 1;
  }
  const total = await prisma.engagement_steps.count({
    where: { domain_key: domainKey, campaign_key: campaignKey, enabled: true },
  });
  return { added, total };
}

type AiActivationDraft = FeatureEmail;

const AI_ACTIVATION_FALLBACK: AiActivationDraft[] = FEATURE_TOUR;

const FEATURE_BRIEF = `
Cover these 10 Referrals.com features in order (one email each) for BRAND MANAGERS:
0 day0 — Dashboard
1 day1 — Brands (logo/colors)
2 day2 — Create campaign / use-case templates
3 day3 — Widget Studio
4 day5 — Integrations / embed
5 day7 — Rewards & coupons
6 day9 — Campaign emails & sharing
7 day11 — Analytics & referrals
8 day14 — Billing / plans
9 day17 — Support + account

CTA hrefs must be from this allowlist:
{{siteUrl}}/dashboard
{{siteUrl}}/brands
{{siteUrl}}/stats
{{siteUrl}}/billing
{{siteUrl}}/account
{{siteUrl}}/contact
{{siteUrl}}/pricing
{{siteUrl}}/support
`;

/**
 * AI rewrites the 10-email feature tour, wrapped in the Referrals branded shell.
 */
export async function aiImproveActivationEmails(
  prisma: EngagementStepsClient,
  domainKey = RF_DOMAIN_KEY,
  campaignKey = RF_ENGAGEMENT_CAMPAIGN
): Promise<{ touched: number; ai: boolean }> {
  let drafts: AiActivationDraft[] | null = null;
  let usedAi = false;

  if (aiEnabled()) {
    const prompt = `You are the Referrals.com lifecycle email agent. Write a 10-email sequence that gets BRAND MANAGERS to check out Referrals features (product tour), not generic hype.

${FEATURE_BRIEF}

Audience: new / free brand managers running referral programs.
Tone: warm, direct, practical — short. Each email highlights ONE feature and one CTA.
Use {{firstname}} in subject or heading.

Return ONLY a JSON array of exactly 10 objects:
[{
  "stepOrder": 0,
  "delayDays": 0,
  "subject": "...",
  "heading": "...",
  "bodyHtml": "<p style=\\"...\\">inner HTML only — NO logo, NO outer wrapper</p>",
  "ctaLabel": "Button →",
  "ctaHref": "{{siteUrl}}/dashboard"
}]

delayDays must be: 0,1,2,3,5,7,9,11,14,17
stepOrder: 0..9`;

    const text = await completeText(prompt, {
      maxTokens: 4500,
      system:
        "You write brand-manager product-tour emails for Referrals.com. Output JSON array only. No markdown.",
    });

    if (text) {
      try {
        const json = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(json) as AiActivationDraft[];
        if (Array.isArray(parsed) && parsed.length >= 10) {
          drafts = parsed
            .slice(0, 10)
            .map((d, i) => {
              const fb = AI_ACTIVATION_FALLBACK[i]!;
              return {
                stepOrder: Number(d.stepOrder ?? i),
                delayDays: Math.max(0, Number(d.delayDays ?? fb.delayDays)),
                subject: String(d.subject || fb.subject).slice(0, 200),
                heading: String(d.heading || fb.heading),
                bodyHtml: String(d.bodyHtml || fb.bodyHtml),
                ctaLabel: String(d.ctaLabel || fb.ctaLabel),
                ctaHref: String(d.ctaHref || fb.ctaHref),
              };
            })
            .sort((a, b) => a.stepOrder - b.stepOrder);
          usedAi = true;
        }
      } catch {
        drafts = null;
      }
    }
  }

  const finalDrafts = drafts?.length === 10 ? drafts : AI_ACTIVATION_FALLBACK;
  let touched = 0;
  for (const d of finalDrafts) {
    await upsertActivationStep(
      prisma,
      {
        stepOrder: d.stepOrder,
        delayDays: d.delayDays,
        subject: d.subject,
        bodyHtml: buildBrandedEngagementEmail({
          heading: d.heading,
          bodyHtml: d.bodyHtml,
          ctaLabel: d.ctaLabel,
          ctaHref: d.ctaHref,
        }),
      },
      domainKey,
      campaignKey
    );
    touched += 1;
  }
  return { touched, ai: usedAi };
}

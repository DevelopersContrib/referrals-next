import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCampaignByIdIfAccessible } from "@/lib/brand-access";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";
import { chatJSON, generateImage, hasOpenAI, OpenAIError } from "@/lib/openai";
import { persistImageToS3 } from "@/lib/s3";

export const maxDuration = 60;

type AssistAction =
  | "emails"
  | "invite"
  | "bannerHtml"
  | "bannerImage"
  | "campaignImage"
  | "brandColors"
  | "widgetTheme";

const COLOR_ROLES = ["primary", "secondary", "accent", "background", "text"] as const;
type ColorRole = (typeof COLOR_ROLES)[number];

/** Coerce a value to a '#rrggbb' string, or null if it isn't a valid hex. */
function toHex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? `#${s.toLowerCase()}` : null;
}

/** Normalize hex strings (with or without '#') to '#rrggbb'; drop invalid ones. */
function normalizeHexColors(input: unknown): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const s = v.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(s)) out.push(`#${s.toLowerCase()}`);
  };
  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object") {
        push((item as Record<string, unknown>).hex);
        push((item as Record<string, unknown>).color);
      }
    }
  } else if (input && typeof input === "object") {
    for (const v of Object.values(input as Record<string, unknown>)) push(v);
  }
  return Array.from(new Set(out)).slice(0, 6);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasOpenAI()) {
    return NextResponse.json(
      { error: "AI features are not configured (missing OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  let body: { action?: AssistAction; context?: Record<string, string | undefined> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  const ctx = body.context || {};

  try {
    if (action === "emails") {
      const prompt = `You help write referral campaign emails. Given this context, return ONLY valid JSON with keys:
reward_notify_subject (string, max 120 chars),
reward_notify_message (string, plain text or simple <p> tags, max 800 chars),
campaign_entry_subject (string, max 120 chars),
campaign_entry_message (string, plain text or simple <p> tags, max 800 chars).

Context:
- Campaign name: ${ctx.name || "Untitled"}
- Goal: ${ctx.goalSummary || "referrals"}
- Reward type: ${ctx.rewardTypeName || "reward"}
- Brand: ${ctx.brandUrl || "our brand"}

Tone: friendly, clear, trustworthy. No placeholder brackets like [name] unless essential.`;

      const parsed = await chatJSON<Record<string, string>>({ prompt, temperature: 0.7 });
      return NextResponse.json({
        reward_notify_subject: String(parsed.reward_notify_subject || "").slice(0, 200),
        reward_notify_message: String(parsed.reward_notify_message || "").slice(0, 2000),
        campaign_entry_subject: String(parsed.campaign_entry_subject || "").slice(0, 200),
        campaign_entry_message: String(parsed.campaign_entry_message || "").slice(0, 2000),
      });
    }

    if (action === "invite") {
      const prompt = `You write the share/invite content for a referral campaign. Return ONLY valid JSON with keys:
invite_subject (string, max 120 chars) — the subject line of the email a participant sends to invite a friend,
invite_message (string, simple HTML using <p>, <strong>, <br> only, max 800 chars) — warm, personal invite email body,
social_description (string, max 200 chars, no HTML) — the blurb shown when the campaign link is shared on social.

You MAY use these placeholders where natural: [name] (the recipient), [invited_by_name] (the sender), [brand], [link].

Context:
- Campaign name: ${ctx.name || "Untitled"}
- Goal: ${ctx.goalSummary || "referrals"}
- Reward type: ${ctx.rewardTypeName || "reward"}
- Brand: ${ctx.brandUrl || "our brand"}

Tone: friendly, personal, trustworthy — like a recommendation from a friend.`;

      const parsed = await chatJSON<Record<string, string>>({ prompt, temperature: 0.7 });
      return NextResponse.json({
        invite_subject: String(parsed.invite_subject || "").slice(0, 200),
        invite_message: String(parsed.invite_message || "").slice(0, 2000),
        social_description: String(parsed.social_description || "").slice(0, 300),
      });
    }

    if (action === "bannerHtml") {
      const prompt = `Create a compact HTML snippet for a referral widget "hero" section (NOT a full document). Max height ~140px. Use inline CSS only.

Rules:
- Only use: div, span, p, strong, em, br, img (https images only), a (https only)
- No script, iframe, svg with foreignObject, no event handlers
- Width 100%, responsive, rounded corners optional
- Match campaign vibe

Campaign name: ${ctx.name || "Referral program"}
Short description: ${ctx.widgetDescription || ctx.goalSummary || "Join and earn rewards"}
Brand: ${ctx.brandUrl || ""}

Return ONLY valid JSON: { "html": "<div>...</div>" }`;

      const parsed = await chatJSON<{ html?: string }>({
        prompt,
        temperature: 0.6,
        system: "You only output valid JSON with an html string.",
      });
      const html = sanitizeWidgetHtml(String(parsed.html || ""));
      return NextResponse.json({ html });
    }

    if (action === "bannerImage") {
      const prompt = `Abstract marketing banner background, no text, no logos, professional, wide horizontal composition, soft gradients, for: ${ctx.name || "referral program"}. ${ctx.widgetDescription || ""}`;
      const url = await generateImage({ prompt });
      return NextResponse.json({ url });
    }

    if (action === "campaignImage") {
      const memberId = parseInt(session.user!.id, 10);
      const isAdmin = Boolean(
        (session.user as { isAdmin?: boolean }).isAdmin
      );

      // Gather brand context: widget colors + brand intelligence (if analyzed).
      let campaignName = ctx.name || "referral campaign";
      let domain = ctx.brandUrl || "";
      let industry = "";
      let voice = "";
      let summary = "";
      let palette: string[] = [];

      const cid = parseInt(String(ctx.campaignId ?? ""), 10);
      if (Number.isFinite(cid) && cid > 0) {
        const campaign = await getCampaignByIdIfAccessible(cid, memberId, isAdmin);
        if (!campaign) {
          return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        campaignName = campaign.name || campaignName;

        const [widget, brand] = await Promise.all([
          prisma.campaign_widget.findFirst({
            where: { campaign_id: campaign.id },
            select: { color: true, button_color: true, text_color: true },
          }),
          prisma.member_urls.findFirst({
            where: { id: campaign.url_id },
            select: { domain: true, brand_colors: true },
          }),
        ]);
        domain = brand?.domain || domain;
        // Prefer the brand's saved palette, then fall back to widget colors.
        const brandPalette = normalizeHexColors(brand?.brand_colors);
        palette = Array.from(
          new Set([
            ...brandPalette,
            ...normalizeHexColors([
              widget?.color,
              widget?.button_color,
              widget?.text_color,
            ]),
          ])
        ).slice(0, 6);

        try {
          const analysis = await prisma.brand_analysis.findFirst({
            where: { url_id: campaign.url_id, status: "completed" },
            orderBy: { id: "desc" },
            select: { id: true },
          });
          if (analysis) {
            const [crawl, intel] = await Promise.all([
              prisma.brand_crawl.findFirst({
                where: { analysis_id: analysis.id },
                select: { colors: true },
              }),
              prisma.brand_intelligence.findFirst({
                where: { analysis_id: analysis.id },
                select: { industry: true, brand_voice: true, summary: true },
              }),
            ]);
            industry = intel?.industry || "";
            voice = intel?.brand_voice || "";
            summary = intel?.summary || "";
            const crawlColors = normalizeHexColors(crawl?.colors);
            palette = Array.from(new Set([...crawlColors, ...palette])).slice(0, 6);
          }
        } catch {
          // brand analysis is optional — ignore if unavailable
        }
      }

      const variation = parseInt(String(ctx.variation ?? "0"), 10) || 0;

      // Let the model choose the best style + write an image prompt.
      let style = "abstract gradient";
      let imagePrompt =
        `Marketing image for a referral campaign "${campaignName}"` +
        (domain ? ` for the brand ${domain}` : "") +
        `. Professional, wide horizontal composition, no text, no words, no logos, no watermarks.` +
        (palette.length ? ` Use this color palette: ${palette.join(", ")}.` : "");

      try {
        const decided = await chatJSON<{ style?: string; prompt?: string }>({
          system: "You are an art director. Output only valid JSON.",
          temperature: 0.8,
          prompt: `Decide the best image style and write an image-generation prompt for a referral marketing campaign image.

Brand: ${domain || "(unknown)"}
Industry: ${industry || "(unknown)"}
Brand voice: ${voice || "friendly, trustworthy, modern"}
Business summary: ${summary ? summary.slice(0, 300) : "(none)"}
Campaign name: ${campaignName}
Reward: ${ctx.rewardTypeName || "(unspecified)"}
Color palette (use as dominant colors): ${palette.length ? palette.join(", ") : "brand-appropriate colors"}
Variation seed: ${variation}

Return ONLY JSON:
{
  "style": one of "photographic lifestyle" | "product showcase" | "abstract gradient" | "flat illustration" | "3d render" — choose what best fits this brand and industry,
  "prompt": string — a vivid, specific prompt (max 60 words) for an image model. It MUST incorporate the color palette, match the brand voice, be a wide horizontal banner composition, and contain NO text, NO words, NO logos, NO watermarks. Vary the composition based on the variation seed.
}`,
        });
        if (decided.style) style = decided.style;
        if (decided.prompt && decided.prompt.trim()) imagePrompt = decided.prompt.trim();
      } catch {
        // fall back to the deterministic prompt built above
      }

      const raw = await generateImage({ prompt: imagePrompt });
      const key = `uploads/campaigns/${memberId}_${Date.now()}.png`;
      let url = raw;
      try {
        url = await persistImageToS3(raw, key);
      } catch (e) {
        console.error("persistImageToS3 failed", e);
        // If it was already a hosted URL, return it as-is; data URIs would be
        // too large to store, so surface an error in that case.
        if (raw.startsWith("data:")) {
          return NextResponse.json(
            { error: "Could not save generated image. Try again." },
            { status: 502 }
          );
        }
      }

      return NextResponse.json({ url, kind: style });
    }

    if (action === "brandColors") {
      const website = (ctx.website || ctx.brandUrl || "").trim();
      const logoUrl = (ctx.logoUrl || "").trim();

      // Source: "logo" | "website" | "surprise" | "auto" (default).
      let mode = (ctx.source || "auto").trim();
      if (mode === "auto") mode = logoUrl ? "logo" : "website";

      if (mode === "logo" && !logoUrl) {
        return NextResponse.json(
          { error: "Add a logo first to generate colors from it" },
          { status: 400 }
        );
      }
      if (mode === "website" && !website) {
        return NextResponse.json(
          { error: "Add a website URL first" },
          { status: 400 }
        );
      }

      let temperature = 0.6;
      let useImages: string[] | undefined;
      let instruction: string;
      if (mode === "logo") {
        useImages = [logoUrl];
        instruction =
          "A logo image is attached — extract the dominant, on-brand colors from it and build the palette around them.";
      } else if (mode === "surprise") {
        temperature = 0.95;
        const seed = Math.floor(Math.random() * 100000);
        instruction = `Surprise the user: invent a bold, original, unexpected yet harmonious and accessible palette. Be creative and avoid clichés. Creative seed: ${seed}.`;
      } else {
        instruction =
          "No logo — infer an on-brand, industry-appropriate palette from the website/brand.";
      }

      const parsed = await chatJSON<{
        colors?: Record<string, unknown>;
        mood?: unknown;
      }>({
        model: "gpt-4o",
        temperature,
        imageUrls: useImages,
        system:
          "You are a brand designer. Output only valid JSON. All colors must be 6-digit hex like #1a2b3c.",
        prompt: `Derive a cohesive brand color palette for this brand.

Website: ${website || "(unknown)"}
${instruction}

Return ONLY JSON in this exact shape:
{
  "colors": {
    "primary": "#rrggbb",    // main brand color (buttons, links)
    "secondary": "#rrggbb",  // supporting color
    "accent": "#rrggbb",     // highlight / call-to-action pop
    "background": "#rrggbb",  // page/surface background (usually light)
    "text": "#rrggbb"        // primary readable text color
  },
  "mood": string  // 3-6 word description of the palette's feel
}

The palette must be harmonious, accessible (readable text on background), and true to the brand.`,
      });

      const colors: Partial<Record<ColorRole, string>> = {};
      for (const role of COLOR_ROLES) {
        const hex = toHex((parsed.colors || {})[role]);
        if (hex) colors[role] = hex;
      }
      if (Object.keys(colors).length === 0) {
        return NextResponse.json(
          { error: "Could not generate a palette. Try again." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        colors,
        source: mode,
        mood: typeof parsed.mood === "string" ? parsed.mood.slice(0, 80) : "",
      });
    }

    if (action === "widgetTheme") {
      const memberId = parseInt(session.user!.id, 10);
      const campaignIdRaw = ctx.campaignId;
      const campaignId =
        typeof campaignIdRaw === "string"
          ? parseInt(campaignIdRaw, 10)
          : Number(campaignIdRaw);
      if (!Number.isFinite(campaignId) || campaignId <= 0) {
        return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
      }

      const campaign = await prisma.member_campaigns.findFirst({
        where: { id: campaignId, member_id: memberId },
        select: { id: true, name: true, goal_type: true, num_visits: true, num_signups: true },
      });
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      const goalLine =
        campaign.goal_type === "visit"
          ? `${campaign.num_visits ?? "?"} referral visits`
          : `${campaign.num_signups ?? "?"} referral signups`;

      const prompt = `You design referral widget UI copy and colors for an embeddable signup widget.
Return ONLY valid JSON with these keys (all strings except where noted):
- header_title (max 80 chars, compelling)
- description (max 400 chars, plain text, line breaks ok as \\n)
- button_text (max 24 chars, action-oriented)
- success_message (max 200 chars)
- field_label_1 (default "Full Name" style, max 40 chars)
- field_label_2 (default "Email" style, max 40 chars)
- color (exactly 6 hex characters, no #, primary accent — e.g. FF5C62 or 6366f1)
- button_color (6 hex, no #, can match color or contrast)
- text_color (6 hex, no #, must be readable on background)
- background_color (6 hex, no #, usually ffffff or very light)
- body_text (optional string: short safe HTML block using ONLY div, span, p, strong, em, br — max 600 chars of tags+text; no script, iframe, or event handlers; can be empty string)

Campaign name: ${campaign.name}
Goal: ${goalLine}
Brand hint: ${ctx.brandUrl || ""}
Extra vibe from user: ${ctx.vibe || "friendly, trustworthy, modern"}

Ensure color fields match /^[0-9A-Fa-f]{6}$/.`;

      const parsed = await chatJSON<Record<string, string>>({ prompt, temperature: 0.65 });

      const hex = (v: string) => {
        const s = String(v || "").replace(/#/g, "").slice(0, 6);
        return /^[0-9A-Fa-f]{6}$/.test(s) ? s : "6366f1";
      };

      const bodyHtml = sanitizeWidgetHtml(String(parsed.body_text || ""));

      return NextResponse.json({
        header_title: String(parsed.header_title || "Join our referral program").slice(0, 120),
        description: String(parsed.description || "").slice(0, 650),
        button_text: String(parsed.button_text || "Join now").slice(0, 80),
        success_message: String(parsed.success_message || "Thanks for joining!").slice(0, 300),
        field_label_1: String(parsed.field_label_1 || "Full name").slice(0, 80),
        field_label_2: String(parsed.field_label_2 || "Email").slice(0, 80),
        color: hex(parsed.color),
        button_color: hex(parsed.button_color),
        text_color: hex(parsed.text_color),
        background_color: hex(parsed.background_color),
        body_text: bodyHtml,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof OpenAIError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("campaigns/ai/assist", e);
    return NextResponse.json({ error: "Assist failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";

type AssistAction = "emails" | "bannerHtml" | "bannerImage";

const OPENAI_CHAT = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE = "https://api.openai.com/v1/images/generations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI features are not configured (missing OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  let body: { action?: AssistAction; context?: Record<string, string> };
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

      const res = await fetch(OPENAI_CHAT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You only output valid JSON objects. No markdown." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("OpenAI emails error", err);
        return NextResponse.json({ error: "AI request failed" }, { status: 502 });
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

      let parsed: Record<string, string>;
      try {
        parsed = JSON.parse(text) as Record<string, string>;
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
      }
      return NextResponse.json({
        reward_notify_subject: String(parsed.reward_notify_subject || "").slice(0, 200),
        reward_notify_message: String(parsed.reward_notify_message || "").slice(0, 2000),
        campaign_entry_subject: String(parsed.campaign_entry_subject || "").slice(0, 200),
        campaign_entry_message: String(parsed.campaign_entry_message || "").slice(0, 2000),
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

      const res = await fetch(OPENAI_CHAT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.6,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You only output valid JSON with an html string." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        console.error("OpenAI bannerHtml error", await res.text());
        return NextResponse.json({ error: "AI request failed" }, { status: 502 });
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content;
      if (!text) return NextResponse.json({ error: "Empty AI response" }, { status: 502 });

      let parsed: { html?: string };
      try {
        parsed = JSON.parse(text) as { html?: string };
      } catch {
        return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
      }
      const html = sanitizeWidgetHtml(String(parsed.html || ""));
      return NextResponse.json({ html });
    }

    if (action === "bannerImage") {
      // Prefer GPT Image (gpt-image-1*, same Images API). DALL·E 2/3 are deprecated May 2026 — see OpenAI image docs.
      const imageModel =
        process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1-mini";
      const isDallE = imageModel.startsWith("dall-e");

      const prompt = `Abstract marketing banner background, no text, no logos, professional, wide horizontal composition, soft gradients, for: ${ctx.name || "referral program"}. ${ctx.widgetDescription || ""}`.slice(
        0,
        32000
      );

      const imageBody: Record<string, unknown> = {
        model: imageModel,
        prompt,
        n: 1,
      };

      if (isDallE) {
        imageBody.size =
          imageModel === "dall-e-2" ? "1024x1024" : "1792x1024";
        imageBody.quality = imageModel === "dall-e-3" ? "standard" : undefined;
        imageBody.response_format = "url";
      } else {
        // GPT Image models: b64_json by default; no hosted `url` — see /v1/images/generations reference.
        imageBody.size = "1536x1024";
        imageBody.quality = "medium";
      }

      const res = await fetch(OPENAI_IMAGE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageBody),
      });

      if (!res.ok) {
        console.error("OpenAI image error", await res.text());
        return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
      }

      const data = (await res.json()) as {
        data?: { url?: string; b64_json?: string }[];
      };
      const first = data.data?.[0];
      const hosted = first?.url;
      if (hosted) {
        return NextResponse.json({ url: hosted });
      }
      const b64 = first?.b64_json;
      if (b64) {
        const dataUrl = `data:image/png;base64,${b64}`;
        return NextResponse.json({ url: dataUrl });
      }

      return NextResponse.json({ error: "No image in response" }, { status: 502 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("campaigns/ai/assist", e);
    return NextResponse.json({ error: "Assist failed" }, { status: 500 });
  }
}

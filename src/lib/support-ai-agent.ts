import { helpArticlesCatalogForAi } from "@/lib/knowledgebase-articles";
import { chatJSON, hasOpenAI } from "@/lib/openai";

export type SupportAiAction = "resolve" | "clarify" | "escalate";

export type SupportAiDecision = {
  action: SupportAiAction;
  reply: string;
  internal_note?: string;
  confidence: number;
};

const KNOWLEDGE_PACK = `
Referrals.com helps brands run referral, affiliate, and word-of-mouth campaigns.

App map (logged-in members):
- /dashboard — overview
- /brands — manage brands (sites/products you promote)
- /brands/[id]/campaigns — campaigns per brand
- Campaign wizard: rewards, goals (visits/signups), widget embed, integrations
- /contacts — participant contacts from campaigns
- /developer/docs — REST API, webhooks, Zapier
- /support — help articles
- /contact — contact support
- Billing: /pricing, PayPal checkout; manage plan from account/billing flows

Common topics:
- Embed widget: campaign → Integrations tab → copy snippet or use referral.js
- Campaign types: referral link, contest, two-way rewards, social share
- Subdomains / white-label: Enterprise / admin-assisted setup
- API keys: developer settings per campaign
- Participants vs members: members own brands; participants join campaigns

Escalate (never auto-resolve):
- Refunds, charge disputes, billing errors needing manual adjustment
- Account deletion, legal, abuse
- Custom enterprise / SLA / white-label contracts
- Suspected platform bugs with no known workaround
`.trim();

function knowledgeWithLinks(): string {
  return `${KNOWLEDGE_PACK}

Allowlisted help article links (use full https URLs in replies):
${helpArticlesCatalogForAi()}`;
}

export async function runSupportAiAgent(input: {
  subject: string;
  category: string;
  priority: string;
  source?: string;
  messages: { author_type: string; body: string }[];
  member: {
    plan_id: number | null;
    plan_expiry: Date | null;
  } | null;
}): Promise<SupportAiDecision> {
  if (!hasOpenAI()) {
    return {
      action: "escalate",
      reply: "Thanks — I'm connecting you with our support team.",
      internal_note: "OPENAI_API_KEY not set",
      confidence: 0,
    };
  }

  const thread = input.messages
    .map((m) => `${m.author_type}: ${m.body}`)
    .join("\n\n")
    .slice(0, 6000);

  const parsed = await chatJSON<Partial<SupportAiDecision>>({
    model: process.env.OPENAI_SUPPORT_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0.25,
    json: true,
    system: `You are Referrals.com Support Assistant.
Use ONLY the knowledge pack. Return JSON: { "action": "resolve"|"clarify"|"escalate", "reply": string, "internal_note"?: string, "confidence": number 0-1 }.
- resolve: clear how-to (confidence >= 0.75), numbered steps, links to /support articles
- clarify: one focused question
- escalate: billing/refunds/legal/bugs/low confidence
Public reply: concise, friendly. Include 1-2 allowlisted help URLs when helpful.

${knowledgeWithLinks()}`,
    prompt: `Category: ${input.category}
Priority: ${input.priority}
Subject: ${input.subject}
Source: ${input.source || "contact_form"}
Member plan_id: ${input.member?.plan_id ?? "guest"}
Plan expiry: ${input.member?.plan_expiry?.toISOString?.() ?? "n/a"}

Thread:
${thread}`,
  });

  const action: SupportAiAction =
    parsed.action === "resolve" || parsed.action === "clarify" || parsed.action === "escalate"
      ? parsed.action
      : "escalate";
  const confidence =
    typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0;

  if (input.category === "billing") {
    return {
      action: "escalate",
      reply: parsed.reply?.trim() || "I'll have our billing team review this and follow up by email.",
      internal_note: parsed.internal_note || "billing category",
      confidence: 0,
    };
  }

  return {
    action,
    reply: (parsed.reply || "").trim() || "Thanks for reaching out.",
    internal_note: parsed.internal_note,
    confidence,
  };
}

export async function draftStaffSupportReply(input: {
  subject: string;
  publicId: string;
  status: string;
  staffHint?: string;
  messages: { author_type: string; body: string; is_internal?: boolean }[];
  requesterName: string | null;
}): Promise<{ draft: string; tips: string[] }> {
  if (!hasOpenAI()) {
    return { draft: "", tips: ["OPENAI_API_KEY is not set — write the reply manually."] };
  }

  const firstName = (input.requesterName || "").trim().split(/\s+/)[0] || "there";
  const publicThread = input.messages
    .filter((m) => !m.is_internal)
    .map((m) => `${m.author_type}: ${m.body}`)
    .join("\n\n")
    .slice(0, 7000);

  const parsed = await chatJSON<{ draft?: string; tips?: unknown }>({
    model: process.env.OPENAI_SUPPORT_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0.45,
    json: true,
    system: `Draft a public support reply for Referrals.com staff. First person, proactive, numbered steps when helpful.
Include 1-2 allowlisted help article URLs. Do NOT add signature — panel adds it.
Return JSON: { "draft": string, "tips": string[] }

${knowledgeWithLinks()}`,
    prompt: `Ticket: ${input.publicId}
Subject: ${input.subject}
Status: ${input.status}
Customer first name: ${firstName}
Staff hint: ${input.staffHint?.trim() || "(none)"}

Thread:
${publicThread}`,
  });

  const tips = Array.isArray(parsed.tips)
    ? parsed.tips.filter((t): t is string => typeof t === "string").slice(0, 6)
    : [];

  return { draft: (parsed.draft || "").trim(), tips };
}

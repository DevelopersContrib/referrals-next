/**
 * Shared AI wrapper. Centralizes the Chat Completions + Images calls that
 * were previously copy-pasted across campaigns/ai/assist, admin/blog/generate,
 * and the brand-analysis runners.
 *
 * Text calls go to OpenAI first and fall back to Claude (Anthropic) when the
 * OpenAI call fails for any reason (out of credit, outage, timeout) or when
 * only ANTHROPIC_API_KEY is configured. Image generation stays OpenAI-only.
 */
import Anthropic from "@anthropic-ai/sdk";

export const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";

export const DEFAULT_CHAT_MODEL = "gpt-4o";
export const CLAUDE_CHAT_MODEL = "claude-opus-5-5";

export function hasClaude(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** True when any text-AI provider is configured (OpenAI or the Claude fallback). */
export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY || hasClaude();
}

/** Error carrying an HTTP-ish status so API routes can map it to a response. */
export class OpenAIError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "OpenAIError";
    this.status = status;
  }
}

export interface ChatOptions {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the API for a strict JSON object response. Default false. */
  json?: boolean;
  /** Abort the request after this many ms (default 60s). */
  timeoutMs?: number;
  /** Image URLs to include with the prompt for vision (requires a vision model). */
  imageUrls?: string[];
}

/**
 * Low-level chat call. Returns the raw assistant message text. Throws OpenAIError.
 * OpenAI first; Claude when OpenAI fails or isn't configured.
 */
export async function chatComplete(opts: ChatOptions): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    if (hasClaude()) return claudeComplete(opts);
    throw new OpenAIError("AI features are not configured (missing OPENAI_API_KEY).", 503);
  }
  try {
    return await openAIComplete(opts);
  } catch (e) {
    if (!hasClaude()) throw e;
    console.warn("[ai] OpenAI failed; retrying with Claude:", e instanceof Error ? e.message : e);
    return claudeComplete(opts);
  }
}

let anthropicClient: Anthropic | null = null;
function claude(): Anthropic {
  // Org-level keys (not created inside a workspace) must name the workspace
  // to bill on every request; workspace-scoped keys don't need this.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  anthropicClient ??= new Anthropic(
    workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}
  );
  return anthropicClient;
}

/** Same contract as the OpenAI call, served by Claude. */
async function claudeComplete(opts: ChatOptions): Promise<string> {
  const images = (opts.imageUrls ?? []).filter(
    (u) => typeof u === "string" && /^https?:\/\//i.test(u)
  );
  const prompt = opts.json
    ? `${opts.prompt}\n\nRespond with only one valid JSON object. No markdown, no code fences.`
    : opts.prompt;

  try {
    const res = await claude().beta.messages.create(
      {
        model: CLAUDE_CHAT_MODEL,
        // Thinking is always on for this model, so leave room above the answer.
        max_tokens: Math.max(opts.maxTokens ?? 0, 16000),
        ...(opts.system ? { system: opts.system } : {}),
        messages: [
          {
            role: "user",
            content: [
              ...images.map((url) => ({
                type: "image" as const,
                source: { type: "url" as const, url },
              })),
              { type: "text" as const, text: prompt },
            ],
          },
        ],
        // Short structured copy: low effort keeps it fast inside module timeouts.
        output_config: { effort: "low" },
        // Server-side retry on another model if this one declines for policy reasons.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { timeout: opts.timeoutMs ?? 60_000, maxRetries: 1 }
    );

    if (res.stop_reason === "refusal") {
      throw new OpenAIError("AI declined this request", 422);
    }
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    if (!text) throw new OpenAIError("Empty AI response", 502);
    return text;
  } catch (e) {
    if (e instanceof OpenAIError) throw e;
    if (e instanceof Anthropic.APIConnectionTimeoutError) {
      throw new OpenAIError("AI request timed out", 504);
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Claude chat error", e.status, e.message.slice(0, 300));
    }
    throw new OpenAIError("AI request failed", 502);
  }
}

/** The original OpenAI Chat Completions call. */
async function openAIComplete(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);

  const validImages = (opts.imageUrls ?? []).filter(
    (u) => typeof u === "string" && /^https?:\/\//i.test(u)
  );
  const userContent =
    validImages.length > 0
      ? [
          { type: "text" as const, text: opts.prompt },
          ...validImages.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ]
      : opts.prompt;

  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_CHAT_MODEL,
        temperature: opts.temperature ?? 0.7,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
          { role: "user" as const, content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("OpenAI chat error", res.status, err.slice(0, 500));
      throw new OpenAIError("AI request failed", 502);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new OpenAIError("Empty AI response", 502);
    return text;
  } catch (e) {
    if (e instanceof OpenAIError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new OpenAIError("AI request timed out", 504);
    }
    throw new OpenAIError("AI request failed", 502);
  } finally {
    clearTimeout(timer);
  }
}

/** Chat call that parses a JSON object response. Tolerates ```json fences. */
export async function chatJSON<T = Record<string, unknown>>(
  opts: ChatOptions
): Promise<T> {
  const text = await chatComplete({
    json: true,
    system: opts.system ?? "You only output valid JSON objects. No markdown.",
    ...opts,
  });
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new OpenAIError("AI returned invalid JSON", 502);
  }
}

export interface ImageOptions {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
}

/** Generate a single image; returns a hosted URL or a data: URL. Throws OpenAIError. */
export async function generateImage(opts: ImageOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new OpenAIError("AI features are not configured.", 503);

  const imageModel = opts.model || process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1-mini";
  const isDallE = imageModel.startsWith("dall-e");

  const body: Record<string, unknown> = { model: imageModel, prompt: opts.prompt.slice(0, 32000), n: 1 };
  if (isDallE) {
    body.size = opts.size ?? (imageModel === "dall-e-2" ? "1024x1024" : "1792x1024");
    if (imageModel === "dall-e-3") body.quality = opts.quality ?? "standard";
    body.response_format = "url";
  } else {
    body.size = opts.size ?? "1536x1024";
    body.quality = opts.quality ?? "medium";
  }

  let res: Response;
  try {
    res = await fetch(OPENAI_IMAGE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError")) {
      throw new OpenAIError("AI request timed out", 504);
    }
    throw new OpenAIError("Image generation failed", 502);
  }
  if (!res.ok) {
    console.error("OpenAI image error", await res.text().catch(() => ""));
    throw new OpenAIError("Image generation failed", 502);
  }
  const data = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
  const first = data.data?.[0];
  if (first?.url) return first.url;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  throw new OpenAIError("No image in response", 502);
}

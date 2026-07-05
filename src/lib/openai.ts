/**
 * Shared OpenAI wrapper. Centralizes the Chat Completions + Images calls that
 * were previously copy-pasted across campaigns/ai/assist, admin/blog/generate,
 * and the brand-analysis runners.
 */

export const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";

export const DEFAULT_CHAT_MODEL = "gpt-4o";

export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
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

/** Low-level chat call. Returns the raw assistant message text. Throws OpenAIError. */
export async function chatComplete(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError("AI features are not configured (missing OPENAI_API_KEY).", 503);
  }

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

  const res = await fetch(OPENAI_IMAGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

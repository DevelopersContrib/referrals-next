const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * Plain text from a saved body_text value, or null when nothing readable is
 * left. Rich-text editors save an emptied box as "<p></p>", which should
 * count as empty, and pages that show the value as text should not print
 * tags.
 */
export function bodyTextToPlain(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const text = v
    .replace(/<(?:br|\/p|\/div|\/li)\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text === "[object Object]") return null;
  return text;
}

/**
 * The saved HTML as written, or null when it is empty ("<p></p>", only
 * spaces) or the old "[object Object]" value. Media-only content is kept.
 */
export function cleanBodyHtml(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed === "[object Object]") return null;
  if (/<(?:img|iframe|video)\b/i.test(trimmed)) return trimmed;
  return bodyTextToPlain(trimmed) ? trimmed : null;
}

/**
 * Strip dangerous patterns from HTML intended for referral widget body (dangerouslySetInnerHTML).
 * Not a full HTML sanitizer — pairs with strict model instructions server-side.
 */
export function sanitizeWidgetHtml(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let html = raw.slice(0, 120_000);

  // Remove executable / embedding tags
  html = html.replace(/<\/?(script|iframe|object|embed|link|meta|style|base|form)\b[^>]*>/gi, "");

  // Remove inline event handlers
  html = html.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Block javascript: URLs in href/src
  html = html.replace(/\s(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, ' $1="#"');

  return html.trim();
}

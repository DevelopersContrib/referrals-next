import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";

/**
 * A whitelisted subset of the real `campaign_widget` columns that a use-case
 * preset (or the widget editor) may set. Layout/placement fidelity for
 * floating/topbar comes from `template_id` (resolved in `@/lib/widget-js`),
 * since the `placement` enum only supports embed|popup.
 */
export interface WidgetSettings {
  placement?: "embed" | "popup";
  template_id?: number;
  header_title?: string;
  description?: string;
  button_text?: string;
  join_button_text?: string;
  field_label_1?: string;
  field_label_2?: string;
  success_message?: string;
  body_text?: string;
  background_type?: "color" | "image" | "transparent";
  background_color?: string;
  color?: string;
  button_color?: string;
  text_color?: string;
  header_font_color?: string;
  header_description_color?: string;
  popup_button_text?: string;
  popup_button_color?: string;
  popup_button_position?: string;
  widget_height?: string;
  widget_width?: string;
  banner_image_url?: string;
  background_image?: string;
  left_image?: string;
  stats_on?: boolean;
  allow_countdown?: boolean;
  countdown_end?: string;
}

/** Normalize a hex color to 6 lowercase hex chars (no '#'), or undefined. */
function hex(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : undefined;
}

function str(v: unknown, max: number): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

const COLOR_FIELDS = [
  "color",
  "button_color",
  "background_color",
  "text_color",
  "header_font_color",
  "header_description_color",
  "popup_button_color",
] as const;

const TEXT_100 = [
  "header_title",
  "button_text",
  "field_label_1",
  "field_label_2",
  "widget_height",
  "widget_width",
  "countdown_end",
] as const;

const TEXT_200 = [
  "join_button_text",
  "popup_button_text",
  "popup_button_position",
  "background_image",
] as const;

/**
 * Validate + sanitize an untrusted widget-settings object into a Prisma-safe
 * partial for `campaign_widget` create/update. Only known keys survive; unknown
 * keys are dropped (prevents mass-assignment). Shared by the create route and
 * the widget editor so the rules live in one place.
 */
export function sanitizeWidgetSettings(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};
  const b = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (b.placement === "embed" || b.placement === "popup") out.placement = b.placement;

  const tid =
    typeof b.template_id === "number"
      ? b.template_id
      : parseInt(String(b.template_id ?? ""), 10);
  if (Number.isInteger(tid) && tid >= 1 && tid <= 11) out.template_id = tid;

  if (
    b.background_type === "color" ||
    b.background_type === "image" ||
    b.background_type === "transparent"
  ) {
    out.background_type = b.background_type;
  }

  for (const f of COLOR_FIELDS) {
    const h = hex(b[f]);
    if (h) out[f] = h;
  }
  for (const k of TEXT_100) {
    const s = str(b[k], 100);
    if (s !== undefined) out[k] = s;
  }
  for (const k of TEXT_200) {
    const s = str(b[k], 200);
    if (s !== undefined) out[k] = s;
  }

  const left = str(b.left_image, 250);
  if (left !== undefined) out.left_image = left;
  const desc = str(b.description, 65000);
  if (desc !== undefined) out.description = desc;
  const success = str(b.success_message, 4000);
  if (success !== undefined) out.success_message = success;

  if (typeof b.body_text === "string" && b.body_text.trim()) {
    out.body_text = sanitizeWidgetHtml(b.body_text).slice(0, 4_000_000);
  }
  if (typeof b.banner_image_url === "string" && b.banner_image_url.trim()) {
    out.banner_image_url = b.banner_image_url.trim().slice(0, 4_000_000);
  }
  if (typeof b.stats_on === "boolean") out.stats_on = b.stats_on;
  if (typeof b.allow_countdown === "boolean") out.allow_countdown = b.allow_countdown;

  return out;
}

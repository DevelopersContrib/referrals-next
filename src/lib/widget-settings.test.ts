import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/sanitize-widget-html", () => ({
  sanitizeWidgetHtml: (s: string) => s,
}));

const { sanitizeWidgetSettings } = await import("./widget-settings");

describe("sanitizeWidgetSettings body_text", () => {
  it("accepts a normal string", () => {
    const out = sanitizeWidgetSettings({ body_text: "<p>Hello</p>" });
    expect(out.body_text).toBe("<p>Hello</p>");
  });

  it("rejects [object Object]", () => {
    const out = sanitizeWidgetSettings({ body_text: "[object Object]" });
    expect(out.body_text).toBeUndefined();
  });

  it("rejects non-string values", () => {
    const out = sanitizeWidgetSettings({ body_text: { rich: "text" } });
    expect(out.body_text).toBeUndefined();
  });

  it("rejects empty/whitespace-only string", () => {
    const out = sanitizeWidgetSettings({ body_text: "   " });
    expect(out.body_text).toBeUndefined();
  });
});

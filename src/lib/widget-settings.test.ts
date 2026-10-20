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

describe("sanitizeWidgetSettings background_image clearing", () => {
  it("sets background_image to null when sent as empty string", () => {
    const out = sanitizeWidgetSettings({ background_image: "" });
    expect(out.background_image).toBeNull();
  });

  it("sets background_image to null when sent as whitespace", () => {
    const out = sanitizeWidgetSettings({ background_image: "   " });
    expect(out.background_image).toBeNull();
  });

  it("keeps a valid background_image URL", () => {
    const out = sanitizeWidgetSettings({
      background_image: "https://example.com/bg.png",
    });
    expect(out.background_image).toBe("https://example.com/bg.png");
  });

  it("nulls background_image when background_type is transparent", () => {
    const out = sanitizeWidgetSettings({
      background_type: "transparent",
      background_image: "https://example.com/bg.png",
    });
    expect(out.background_image).toBeNull();
  });

  it("nulls background_image when background_type is color", () => {
    const out = sanitizeWidgetSettings({
      background_type: "color",
      background_image: "https://example.com/bg.png",
    });
    expect(out.background_image).toBeNull();
  });

  it("preserves background_image when background_type is image", () => {
    const out = sanitizeWidgetSettings({
      background_type: "image",
      background_image: "https://example.com/bg.png",
    });
    expect(out.background_image).toBe("https://example.com/bg.png");
  });
});

describe("sanitizeWidgetSettings banner_image_url clearing", () => {
  it("sets banner_image_url to null when sent as empty string", () => {
    const out = sanitizeWidgetSettings({ banner_image_url: "" });
    expect(out.banner_image_url).toBeNull();
  });

  it("keeps a valid banner_image_url", () => {
    const out = sanitizeWidgetSettings({
      banner_image_url: "https://example.com/banner.png",
    });
    expect(out.banner_image_url).toBe("https://example.com/banner.png");
  });
});

describe("sanitizeWidgetSettings background_type", () => {
  it("accepts 'color'", () => {
    const out = sanitizeWidgetSettings({ background_type: "color" });
    expect(out.background_type).toBe("color");
  });

  it("accepts 'image'", () => {
    const out = sanitizeWidgetSettings({ background_type: "image" });
    expect(out.background_type).toBe("image");
  });

  it("accepts 'transparent'", () => {
    const out = sanitizeWidgetSettings({ background_type: "transparent" });
    expect(out.background_type).toBe("transparent");
  });

  it("rejects unknown values", () => {
    const out = sanitizeWidgetSettings({ background_type: "gradient" });
    expect(out.background_type).toBeUndefined();
  });
});

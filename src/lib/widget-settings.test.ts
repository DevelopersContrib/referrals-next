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

describe("sanitizeWidgetSettings color hex normalization", () => {
  it("accepts 6-digit hex without hash", () => {
    const out = sanitizeWidgetSettings({ background_color: "ff0000" });
    expect(out.background_color).toBe("ff0000");
  });

  it("strips leading '#' from 6-digit hex", () => {
    const out = sanitizeWidgetSettings({ background_color: "#aaBBcc" });
    expect(out.background_color).toBe("aabbcc");
  });

  it("expands 3-digit hex to 6-digit", () => {
    const out = sanitizeWidgetSettings({ background_color: "f0a" });
    expect(out.background_color).toBe("ff00aa");
  });

  it("expands 3-digit hex with hash", () => {
    const out = sanitizeWidgetSettings({ color: "#fff" });
    expect(out.color).toBe("ffffff");
  });

  it("expands uppercase 3-digit hex", () => {
    const out = sanitizeWidgetSettings({ button_color: "F00" });
    expect(out.button_color).toBe("ff0000");
  });

  it("rejects invalid hex strings", () => {
    const out = sanitizeWidgetSettings({ background_color: "xyz" });
    expect(out.background_color).toBeUndefined();
  });

  it("rejects empty string", () => {
    const out = sanitizeWidgetSettings({ background_color: "" });
    expect(out.background_color).toBeUndefined();
  });

  it("rejects non-string values", () => {
    const out = sanitizeWidgetSettings({ background_color: 123 });
    expect(out.background_color).toBeUndefined();
  });

  it("applies hex normalization to all color fields", () => {
    const out = sanitizeWidgetSettings({
      color: "abc",
      button_color: "DEF",
      background_color: "#123456",
      text_color: "fff",
      header_font_color: "000",
      header_description_color: "#aaa",
      popup_button_color: "1a2b3c",
    });
    expect(out.color).toBe("aabbcc");
    expect(out.button_color).toBe("ddeeff");
    expect(out.background_color).toBe("123456");
    expect(out.text_color).toBe("ffffff");
    expect(out.header_font_color).toBe("000000");
    expect(out.header_description_color).toBe("aaaaaa");
    expect(out.popup_button_color).toBe("1a2b3c");
  });
});

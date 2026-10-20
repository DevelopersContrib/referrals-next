import { describe, it, expect, vi } from "vitest";

vi.mock("./share-buttons", () => ({ ShareButtons: () => null }));
vi.mock("./reward-display", () => ({ RewardDisplay: () => null }));
vi.mock("@/lib/format-brand", () => ({ formatBrandName: (s: string) => s }));
vi.mock("@/components/brands/brand-logo", () => ({ BrandLogo: () => null }));
vi.mock("@/lib/clipboard", () => ({
  copyText: vi.fn().mockResolvedValue(true),
}));

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const { ReferralWidget } = await import("./referral-widget");

function render(overrides: Record<string, unknown> = {}) {
  const config = {
    campaignId: 530,
    headerTitle: "Test Campaign",
    ...overrides,
  };
  return renderToStaticMarkup(
    React.createElement(ReferralWidget, {
      config: config as any,
      skipImpression: true,
    }),
  );
}

describe("ReferralWidget field labels", () => {
  it("assigns fieldLabel1 to the name input (first field)", () => {
    const html = render({ fieldLabel1: "Full Name", fieldLabel2: "Email Address" });
    const nameLabelMatch = html.match(/<label[^>]*for="rw-name"[^>]*>(.*?)<\/label>/);
    expect(nameLabelMatch?.[1]).toBe("Full Name");
  });

  it("assigns fieldLabel2 to the email input (second field)", () => {
    const html = render({ fieldLabel1: "Full Name", fieldLabel2: "Email Address" });
    const emailLabelMatch = html.match(/<label[^>]*for="rw-email"[^>]*>(.*?)<\/label>/);
    expect(emailLabelMatch?.[1]).toBe("Email Address");
  });

  it("uses correct defaults when no fieldLabels provided", () => {
    const html = render({});
    const nameLabelMatch = html.match(/<label[^>]*for="rw-name"[^>]*>(.*?)<\/label>/);
    const emailLabelMatch = html.match(/<label[^>]*for="rw-email"[^>]*>(.*?)<\/label>/);
    expect(nameLabelMatch?.[1]).toBe("Full Name");
    expect(emailLabelMatch?.[1]).toBe("Email Address");
  });
});

describe("ReferralWidget bodyText rendering", () => {
  it("renders valid bodyText as HTML", () => {
    const html = render({ bodyText: "<p>Welcome!</p>" });
    expect(html).toContain("<p>Welcome!</p>");
  });

  it("does not render [object Object]", () => {
    const html = render({ bodyText: "[object Object]" });
    expect(html).not.toContain("[object Object]");
  });

  it("does not render bodyText block when empty", () => {
    const html = render({ bodyText: "" });
    expect(html).not.toContain("line-height:1.6");
  });

  it("does not render bodyText block when undefined", () => {
    const html = render({});
    expect(html).not.toContain("line-height:1.6");
  });
});

describe("ReferralWidget background rendering", () => {
  it("applies background image only when backgroundType is image", () => {
    const html = render({
      backgroundType: "image",
      backgroundImage: "https://example.com/bg.png",
    });
    expect(html).toContain("url(https://example.com/bg.png)");
  });

  it("does not render background image when backgroundType is transparent", () => {
    const html = render({
      backgroundType: "transparent",
      backgroundImage: "https://example.com/bg.png",
    });
    expect(html).not.toContain("url(https://example.com/bg.png)");
    expect(html).toContain("transparent");
  });

  it("does not render background image when backgroundType is color", () => {
    const html = render({
      backgroundType: "color",
      backgroundColor: "ff0000",
      backgroundImage: "https://example.com/bg.png",
    });
    expect(html).not.toContain("url(https://example.com/bg.png)");
    expect(html).toContain("#ff0000");
  });

  it("uses white default when no background config", () => {
    const html = render({});
    expect(html).toContain("#ffffff");
  });

  it("does not render banner when bannerImageUrl is absent", () => {
    const html = render({ bannerImageUrl: undefined });
    expect(html).not.toContain("background-image");
  });

  it("renders banner when bannerImageUrl is present", () => {
    const html = render({
      bannerImageUrl: "https://example.com/banner.png",
    });
    expect(html).toContain("url(https://example.com/banner.png)");
  });

  it("uses white when backgroundType is image but no backgroundImage is set", () => {
    const html = render({
      backgroundType: "image",
      backgroundColor: "000000",
    });
    expect(html).toContain("#ffffff");
    expect(html).not.toContain("#000000");
  });

  it("uses backgroundColor when backgroundType is color", () => {
    const html = render({
      backgroundType: "color",
      backgroundColor: "abcdef",
    });
    expect(html).toContain("#abcdef");
  });

  it("uses backgroundColor when backgroundType is undefined (legacy compat)", () => {
    const html = render({
      backgroundColor: "cc00ff",
    });
    expect(html).toContain("#cc00ff");
  });
});

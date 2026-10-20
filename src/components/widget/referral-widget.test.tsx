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

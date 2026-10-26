import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member_plan: { findFirst: vi.fn() },
    member_payment: { findFirst: vi.fn() },
    url_plan: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/billing-constants", () => ({
  WINBACK_PLAN_ID: 7,
}));
vi.mock("@/lib/paypal", () => ({
  findSubscriptionPlanIdByName: vi.fn(),
  getAccessToken: vi.fn(),
  getBillingPlan: vi.fn(),
  getOrCreateProduct: vi.fn(),
  getPayPalApiBaseUrl: vi.fn(() => "https://api.sandbox.paypal.com"),
}));

const { winbackPaypalPlanName, winbackCheckoutUrl } = await import("./billing-winback");

describe("winbackPaypalPlanName", () => {
  it("includes the WINBACK_PLAN_ID and both prices", () => {
    const name = winbackPaypalPlanName();
    expect(name).toContain("#7");
    expect(name).toContain("$1.00/MONTH");
    expect(name).toContain("$9.00/MONTH");
  });
});

describe("winbackCheckoutUrl", () => {
  it("builds a checkout URL with brandId and UTM params", () => {
    const url = winbackCheckoutUrl(42, { baseUrl: "https://test.com" });
    expect(url).toBe(
      "https://test.com/billing/plan/7?brandId=42&utm_source=winback&utm_campaign=oct2026",
    );
  });

  it("uses default base URL when none provided", () => {
    const url = winbackCheckoutUrl(1);
    expect(url).toContain("/billing/plan/7?brandId=1");
  });
});

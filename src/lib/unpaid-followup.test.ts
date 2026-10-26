import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ses", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/billing-constants", () => ({
  BRAND_MONTHLY_PLAN_ID: 2,
  PLAN_PUBLIC_NAME: { 2: "Brand, monthly" },
  UNLIMITED_PLAN_ID: 3,
}));
vi.mock("@/lib/engagement-email-templates", () => ({
  buildBrandedEngagementEmail: (opts: { heading: string; bodyHtml: string; ctaLabel: string; ctaHref: string }) =>
    `<html>${opts.heading} ${opts.bodyHtml} ${opts.ctaLabel} ${opts.ctaHref}</html>`,
}));

const {
  pickTimeStep,
  getFollowupEmailDraft,
  getCutoffDays,
  getPerRunCap,
  getAbandonedWindowDays,
  isBrandEntitledPaid,
} = await import("./unpaid-followup");

describe("pickTimeStep", () => {
  const now = new Date("2026-10-26T00:00:00Z");

  it("returns day0 for a brand created now", () => {
    expect(pickTimeStep(new Date("2026-10-26T00:00:00Z"), now)).toBe("day0");
  });

  it("returns day1 for a brand created 1 day ago", () => {
    expect(pickTimeStep(new Date("2026-10-25T00:00:00Z"), now)).toBe("day1");
  });

  it("returns day3 for a brand created 4 days ago", () => {
    expect(pickTimeStep(new Date("2026-10-22T00:00:00Z"), now)).toBe("day3");
  });

  it("returns day7 for a brand created 7+ days ago", () => {
    expect(pickTimeStep(new Date("2026-10-18T00:00:00Z"), now)).toBe("day7");
  });

  it("returns null for a brand created in the future", () => {
    expect(pickTimeStep(new Date("2026-10-27T00:00:00Z"), now)).toBeNull();
  });
});

describe("getFollowupEmailDraft", () => {
  it("returns a draft for every step", () => {
    for (const step of ["day0", "day1", "day3", "day7", "abandoned"] as const) {
      const draft = getFollowupEmailDraft(step, "example.com", 123);
      expect(draft.subject).toBeTruthy();
      expect(draft.heading).toBeTruthy();
      expect(draft.bodyHtml).toContain("example.com");
      expect(draft.ctaHref).toContain("brandId=123");
    }
  });
});

describe("config helpers", () => {
  beforeEach(() => {
    delete process.env.UNPAID_FOLLOWUP_CUTOFF_DAYS;
    delete process.env.UNPAID_FOLLOWUP_PER_RUN_CAP;
    delete process.env.UNPAID_FOLLOWUP_ABANDONED_WINDOW_DAYS;
  });

  it("getCutoffDays returns default 30", () => {
    expect(getCutoffDays()).toBe(30);
  });

  it("getCutoffDays reads env override", () => {
    process.env.UNPAID_FOLLOWUP_CUTOFF_DAYS = "60";
    expect(getCutoffDays()).toBe(60);
  });

  it("getCutoffDays ignores invalid env", () => {
    process.env.UNPAID_FOLLOWUP_CUTOFF_DAYS = "abc";
    expect(getCutoffDays()).toBe(30);
  });

  it("getPerRunCap returns default 200", () => {
    expect(getPerRunCap()).toBe(200);
  });

  it("getPerRunCap reads env override", () => {
    process.env.UNPAID_FOLLOWUP_PER_RUN_CAP = "50";
    expect(getPerRunCap()).toBe(50);
  });

  it("getAbandonedWindowDays returns default 14", () => {
    expect(getAbandonedWindowDays()).toBe(14);
  });

  it("getAbandonedWindowDays reads env override", () => {
    process.env.UNPAID_FOLLOWUP_ABANDONED_WINDOW_DAYS = "7";
    expect(getAbandonedWindowDays()).toBe(7);
  });
});

describe("isBrandEntitledPaid", () => {
  function makePrisma(overrides: {
    urlPlan?: { payment_id: number | null } | null;
    planPrice?: number;
    member?: { plan_id: number | null; plan_expiry: Date | null } | null;
    memberBrands?: { id: number; in_vnoc: boolean | null; vnoc_id: number | null }[];
    accountPlan?: { price: number | null; no_of_domains: number | null } | null;
  }) {
    return {
      url_plan: {
        findFirst: vi.fn().mockResolvedValue(overrides.urlPlan ?? null),
      },
      plans: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: number } }) => {
          if (overrides.accountPlan && overrides.member?.plan_id === where.id) {
            return Promise.resolve(overrides.accountPlan);
          }
          return Promise.resolve(
            overrides.planPrice != null ? { price: overrides.planPrice } : null,
          );
        }),
      },
      members: {
        findUnique: vi.fn().mockResolvedValue(overrides.member ?? null),
      },
      member_urls: {
        findMany: vi.fn().mockResolvedValue(overrides.memberBrands ?? []),
      },
    } as unknown as Parameters<typeof isBrandEntitledPaid>[0];
  }

  it("returns true when brand has active plan_expiry + url_plan with price > 0", async () => {
    const prisma = makePrisma({
      urlPlan: { payment_id: 2 },
      planPrice: 9,
    });
    const future = new Date(Date.now() + 86400000);
    expect(await isBrandEntitledPaid(prisma, 1, 1, future)).toBe(true);
  });

  it("returns false when plan_expiry is in the past", async () => {
    const prisma = makePrisma({
      urlPlan: { payment_id: 2 },
      planPrice: 9,
      member: null,
    });
    const past = new Date(Date.now() - 86400000);
    expect(await isBrandEntitledPaid(prisma, 1, 1, past)).toBe(false);
  });

  it("returns false when url_plan price is 0 (cancelled/free)", async () => {
    const prisma = makePrisma({
      urlPlan: { payment_id: 2 },
      planPrice: 0,
      member: null,
    });
    const future = new Date(Date.now() + 86400000);
    expect(await isBrandEntitledPaid(prisma, 1, 1, future)).toBe(false);
  });

  it("returns false when no url_plan exists and no account plan", async () => {
    const prisma = makePrisma({
      urlPlan: null,
      member: { plan_id: null, plan_expiry: null },
    });
    expect(await isBrandEntitledPaid(prisma, 1, 1, null)).toBe(false);
  });

  it("returns true when covered by Unlimited account plan", async () => {
    const prisma = makePrisma({
      urlPlan: null,
      member: { plan_id: 3, plan_expiry: new Date(Date.now() + 86400000) },
    });
    expect(await isBrandEntitledPaid(prisma, 1, 1, null)).toBe(true);
  });

  it("returns true when covered by Agency plan within cap", async () => {
    const prisma = makePrisma({
      urlPlan: null,
      member: { plan_id: 4, plan_expiry: new Date(Date.now() + 86400000) },
      accountPlan: { price: 49, no_of_domains: 10 },
      memberBrands: [
        { id: 1, in_vnoc: false, vnoc_id: null },
        { id: 2, in_vnoc: false, vnoc_id: null },
      ],
    });
    expect(await isBrandEntitledPaid(prisma, 1, 1, null)).toBe(true);
  });

  it("returns false when agency plan cap exceeded", async () => {
    const brands = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      in_vnoc: false,
      vnoc_id: null,
    }));
    const prisma = makePrisma({
      urlPlan: null,
      member: { plan_id: 4, plan_expiry: new Date(Date.now() + 86400000) },
      accountPlan: { price: 49, no_of_domains: 10 },
      memberBrands: brands,
    });
    expect(await isBrandEntitledPaid(prisma, 11, 1, null)).toBe(false);
  });
});

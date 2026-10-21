import { describe, it, expect, vi } from "vitest";
import { normalizeEncodedSlashPath } from "./proxy";

// Mock the brand-domains module so the proxy function can be imported
// without a real DB / env.
vi.mock("@/lib/brand-domains", () => ({
  brandForHost: vi.fn().mockResolvedValue(null),
  isAppHost: vi.fn().mockReturnValue(true),
  normalizeHost: vi.fn((h: string) => h ?? "www.referrals.com"),
  ROOT_DOMAIN: "referrals.com",
}));

// The real clone config, under the alias proxy.ts imports it by.
vi.mock("@/lib/network-sites", () => import("./lib/network-sites"));

// Import proxy after the mock is registered.
const { proxy } = await import("./proxy");

/* ------------------------------------------------------------------ */
/*  normalizeEncodedSlashPath – pure function                         */
/* ------------------------------------------------------------------ */

describe("normalizeEncodedSlashPath", () => {
  it("decodes %2F to /", () => {
    expect(normalizeEncodedSlashPath("/%2Fdashboard")).toBe("/dashboard");
  });

  it("decodes %2f (lowercase) to /", () => {
    expect(normalizeEncodedSlashPath("/%2fdashboard")).toBe("/dashboard");
  });

  it("decodes %5C to /", () => {
    expect(normalizeEncodedSlashPath("/%5Cadmin")).toBe("/admin");
  });

  it("decodes %5c (lowercase) to /", () => {
    expect(normalizeEncodedSlashPath("/%5cadmin")).toBe("/admin");
  });

  it("collapses consecutive decoded slashes (%2F%2F)", () => {
    expect(normalizeEncodedSlashPath("/%2F%2Fx")).toBe("/x");
  });

  it("collapses //evil.com into /evil.com (no protocol-relative)", () => {
    expect(normalizeEncodedSlashPath("/%2F%2Fevil.com")).toBe("/evil.com");
  });

  it("strips trailing slash", () => {
    expect(normalizeEncodedSlashPath("/%2Fdashboard%2F")).toBe("/dashboard");
  });

  it("preserves bare /", () => {
    expect(normalizeEncodedSlashPath("/%2F")).toBe("/");
  });

  it("handles mixed encoded and literal slashes", () => {
    expect(normalizeEncodedSlashPath("/foo%2Fbar/baz")).toBe("/foo/bar/baz");
  });
});

/* ------------------------------------------------------------------ */
/*  proxy() – integration-level (mocked brand-domains)                */
/* ------------------------------------------------------------------ */

import { NextRequest } from "next/server";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "https://www.referrals.com"));
}

describe("proxy() – encoded-slash handling", () => {
  it("does not intercept a normal (non-encoded) path", async () => {
    const res = await proxy(makeRequest("/pricing"));
    // /pricing is a public exact route → NextResponse.next()
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("308-redirects /%2Fdashboard → /dashboard", async () => {
    const res = await proxy(makeRequest("/%2Fdashboard"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/dashboard");
  });

  it("308-redirects /%2Fadmin → /admin", async () => {
    const res = await proxy(makeRequest("/%2Fadmin"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/admin");
  });

  it("308-redirects /%5Cadmin → /admin", async () => {
    const res = await proxy(makeRequest("/%5Cadmin"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/admin");
  });

  it("collapses /%2F%2Fx → /x", async () => {
    const res = await proxy(makeRequest("/%2F%2Fx"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/x");
  });

  it("blocks open redirect: /%2F%2Fevil.com stays on referrals.com", async () => {
    const res = await proxy(makeRequest("/%2F%2Fevil.com"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.hostname).toBe("www.referrals.com");
    expect(loc.pathname).toBe("/evil.com");
  });

  it("preserves query string through the redirect", async () => {
    const res = await proxy(makeRequest("/%2Fdashboard?tab=stats"));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/dashboard");
    expect(loc.searchParams.get("tab")).toBe("stats");
  });
});

/* ------------------------------------------------------------------ */
/*  proxy() – referral network clones                                 */
/* ------------------------------------------------------------------ */

function hostRequest(host: string, path: string): NextRequest {
  return new NextRequest(new URL(path, `http://${host}`), {
    headers: { "x-forwarded-host": host },
  });
}

describe("proxy() – network clone hosts", () => {
  it("rewrites a clone's home page to /network/<key>", async () => {
    const res = await proxy(hostRequest("referrals-net.localhost", "/"));
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe(
      "/network/referrals-net",
    );
  });

  it("sends clone sign-up through referrals.com /go so it is credited", async () => {
    const res = await proxy(hostRequest("referrals-net.localhost", "/signup"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/go");
    expect(loc.searchParams.get("ref")).toBe("referrals.net");
  });

  it("sends signed-in pages to referrals.com", async () => {
    const res = await proxy(hostRequest("referrals-net.localhost", "/dashboard?tab=1"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.hostname).not.toBe("referrals-net.localhost");
    expect(`${loc.pathname}${loc.search}`).toBe("/dashboard?tab=1");
  });

  it("serves an enabled clone on its real domain, and stops when disabled", async () => {
    const { networkSiteByKey } = await import("./lib/network-sites");
    const site = networkSiteByKey("referrals-net")!;
    const was = site.enabled;
    try {
      site.enabled = true;
      const on = await proxy(hostRequest("referrals.net", "/"));
      expect(new URL(on.headers.get("x-middleware-rewrite")!).pathname).toBe("/network/referrals-net");
      site.enabled = false;
      const off = await proxy(hostRequest("referrals.net", "/"));
      expect(off.headers.get("x-middleware-rewrite")).toBeNull();
    } finally {
      site.enabled = was;
    }
  });

  it("hides /network/* on referrals.com", async () => {
    const res = await proxy(makeRequest("/network/referrals-net"));
    expect(new URL(res.headers.get("x-middleware-rewrite")!).pathname).toBe(
      "/_network-not-found",
    );
  });
});

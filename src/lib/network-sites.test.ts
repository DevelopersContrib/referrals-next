import { describe, it, expect } from "vitest";
import {
  NETWORK_SITES,
  networkAppOrigin,
  networkRoute,
  networkSiteByDomain,
  networkSiteByKey,
  networkSiteForHost,
  networkSignupHref,
} from "./network-sites";

const site = networkSiteByKey("referrals-net")!;

describe("network site config", () => {
  it("has unique keys and domains", () => {
    expect(new Set(NETWORK_SITES.map((s) => s.key)).size).toBe(NETWORK_SITES.length);
    expect(new Set(NETWORK_SITES.map((s) => s.domain)).size).toBe(NETWORK_SITES.length);
  });

  it("finds a site by bare or www domain", () => {
    expect(networkSiteByDomain("referrals.net")?.key).toBe("referrals-net");
    expect(networkSiteByDomain("www.referrals.net")?.key).toBe("referrals-net");
    expect(networkSiteByDomain("evil.com")).toBeNull();
  });

  it("previews any site at <key>.localhost outside production", () => {
    expect(networkSiteForHost("referralprogram.localhost")?.domain).toBe("referralprogram.com");
    expect(networkSiteForHost("nope.localhost")).toBeNull();
  });
});

describe("networkRoute", () => {
  it("rewrites the clone's own pages", () => {
    expect(networkRoute(site, "/")).toEqual({ kind: "rewrite", pathname: "/network/referrals-net" });
    expect(networkRoute(site, "/pricing/")).toEqual({
      kind: "rewrite",
      pathname: "/network/referrals-net/pricing",
    });
    expect(networkRoute(site, "/robots.txt")).toEqual({
      kind: "rewrite",
      pathname: "/network/referrals-net/robots.txt",
    });
  });

  it("lets assets through", () => {
    expect(networkRoute(site, "/_next/static/x.js")).toEqual({ kind: "next" });
    expect(networkRoute(site, "/images/logo.png")).toEqual({ kind: "next" });
  });

  it("credits sign-ups to the clone domain via /go on referrals.com", () => {
    const route = networkRoute(site, "/get-started");
    expect(route).toEqual({ kind: "redirect", url: networkSignupHref(site) });
    const go = new URL(networkSignupHref(site));
    expect(go.origin).toBe(networkAppOrigin());
    expect(go.searchParams.get("ref")).toBe("referrals.net");
    const dest = new URL(go.searchParams.get("url")!);
    expect(dest.pathname).toBe("/signup");
    expect(dest.searchParams.get("via")).toBe("referrals.net");
  });

  it("sends everything else to the same path on referrals.com", () => {
    expect(networkRoute(site, "/blog/hello", "?a=1")).toEqual({
      kind: "redirect",
      url: `${networkAppOrigin()}/blog/hello?a=1`,
    });
  });
});

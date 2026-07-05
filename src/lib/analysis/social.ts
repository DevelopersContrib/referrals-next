/**
 * Social profile discovery + URL normalization.
 * Pure functions (no I/O) so they're reused by the VNOC lookup and the crawler.
 */
import type { DiscoveredSocial } from "./types";

/** Ordered so the "best" platforms surface first in the UI. */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "youtube",
  "tiktok",
  "pinterest",
  "threads",
  "discord",
  "github",
  "reddit",
] as const;

const HOST_PATTERNS: { platform: string; re: RegExp }[] = [
  { platform: "facebook", re: /(^|\.)facebook\.com$/i },
  { platform: "facebook", re: /(^|\.)fb\.com$/i },
  { platform: "instagram", re: /(^|\.)instagram\.com$/i },
  { platform: "linkedin", re: /(^|\.)linkedin\.com$/i },
  { platform: "x", re: /(^|\.)(twitter|x)\.com$/i },
  { platform: "youtube", re: /(^|\.)(youtube\.com|youtu\.be)$/i },
  { platform: "tiktok", re: /(^|\.)tiktok\.com$/i },
  { platform: "pinterest", re: /(^|\.)pinterest\.[a-z.]+$/i },
  { platform: "threads", re: /(^|\.)threads\.(net|com)$/i },
  { platform: "discord", re: /(^|\.)(discord\.gg|discord\.com|discordapp\.com)$/i },
  { platform: "github", re: /(^|\.)github\.com$/i },
  { platform: "reddit", re: /(^|\.)reddit\.com$/i },
];

/** Paths that are share/intent links or generic pages, not real profiles. */
const NON_PROFILE = /\/(sharer|share|intent|dialog|plugins|home|login|signup|about|privacy|tos|terms)\b/i;

export function platformForUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    for (const { platform, re } of HOST_PATTERNS) {
      if (re.test(host)) return platform;
    }
    return null;
  } catch {
    return null;
  }
}

/** Normalize a raw social URL string, or return null if it isn't a usable profile URL. */
export function normalizeSocialUrl(raw: string): string | null {
  let v = (raw || "").trim();
  if (!v || v === "0" || v === "#") return null;

  // Legacy Twitter hash-bang: https://twitter.com/#!/handle -> /handle
  v = v.replace(/\/#!\//, "/");

  if (v.startsWith("//")) v = `https:${v}`;
  if (!/^https?:\/\//i.test(v)) {
    // bare handle or domain — only accept if it looks like a known host
    if (/^[\w.-]+\.[a-z]{2,}\//i.test(v)) v = `https://${v}`;
    else return null;
  }

  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const platform = platformForUrl(u.toString());
  if (!platform) return null;

  const path = u.pathname.replace(/\/+$/, "");
  // Must point at a profile, not the platform root or a share/intent link.
  if (!path || path === "/") return null;
  if (NON_PROFILE.test(u.pathname)) return null;

  u.protocol = "https:";
  u.hash = "";
  u.search = "";
  u.hostname = u.hostname.replace(/^www\./i, "");
  return u.toString().replace(/\/$/, "");
}

/**
 * Discover social profile links from raw HTML: anchor hrefs, og:url, rel="me",
 * and schema.org JSON-LD sameAs arrays.
 */
export function discoverSocialsFromHtml(html: string): DiscoveredSocial[] {
  const found = new Map<string, DiscoveredSocial>();

  const add = (raw: string) => {
    const url = normalizeSocialUrl(raw);
    if (!url) return;
    const platform = platformForUrl(url);
    if (!platform) return;
    if (!found.has(platform)) {
      found.set(platform, { platform, url, source: "crawl" });
    }
  };

  // 1. All href/src URLs
  const hrefRe = /(?:href|content)\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) add(m[1]);

  // 2. schema.org JSON-LD sameAs
  const ldRe = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = ldRe.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim());
      collectSameAs(json, add);
    } catch {
      // ignore malformed JSON-LD
    }
  }

  return [...found.values()];
}

function collectSameAs(node: unknown, add: (u: string) => void) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectSameAs(n, add));
    return;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const same = obj.sameAs;
    if (typeof same === "string") add(same);
    else if (Array.isArray(same)) same.forEach((s) => typeof s === "string" && add(s));
    Object.values(obj).forEach((v) => {
      if (v && typeof v === "object") collectSameAs(v, add);
    });
  }
}

/** Merge VNOC (authoritative) socials with crawled ones; VNOC wins per platform. */
export function mergeSocials(
  vnoc: DiscoveredSocial[],
  crawl: DiscoveredSocial[]
): DiscoveredSocial[] {
  const byPlatform = new Map<string, DiscoveredSocial>();
  for (const s of crawl) byPlatform.set(s.platform, s);
  for (const s of vnoc) byPlatform.set(s.platform, s); // vnoc overrides
  return [...byPlatform.values()].sort(
    (a, b) => platformRank(a.platform) - platformRank(b.platform)
  );
}

function platformRank(p: string): number {
  const i = (SOCIAL_PLATFORMS as readonly string[]).indexOf(p);
  return i === -1 ? 999 : i;
}

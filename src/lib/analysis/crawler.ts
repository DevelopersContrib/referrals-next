/**
 * Lightweight, dependency-free website crawler + extractor.
 * Fetches the homepage plus a few common pages and pulls out brand signals
 * using resilient regex parsing (no headless browser, no cheerio).
 */

const UA =
  "Mozilla/5.0 (compatible; ReferralsBrandBot/1.0; +https://referrals.com/bot)";

export interface CrawlResult {
  name: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  primaryCta: string | null;
  colors: string[];
  fonts: string[];
  products: string[];
  services: string[];
  pricing: string[];
  emails: string[];
  phones: string[];
  addresses: string[];
  languages: string[];
  currencies: string[];
  pagesCrawled: number;
  homepageHtml: string;
  contactHtml: string;
}

async function fetchPage(
  url: string,
  timeoutMs = 12_000
): Promise<{ ok: boolean; status: number; html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("xml") && !ct.includes("text/plain")) {
      return { ok: false, status: res.status, html: "", finalUrl: res.url };
    }
    const html = (await res.text()).slice(0, 600_000);
    return { ok: res.ok, status: res.status, html, finalUrl: res.url };
  } catch {
    return { ok: false, status: 0, html: "", finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

function abs(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function metaContent(html: string, key: string, attr: "name" | "property" = "name"): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const m = re.exec(html);
  if (m) return decodeEntities(m[1].trim());
  // attribute order reversed
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${key}["']`,
    "i"
  );
  const m2 = re2.exec(html);
  return m2 ? decodeEntities(m2[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function uniq(arr: string[], max: number): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].slice(0, max);
}

/** Pull an Organization/logo URL out of any schema.org JSON-LD blocks. */
function extractJsonLdLogo(html: string): string | null {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const json = JSON.parse(b[1].trim());
      const found = findLogo(json);
      if (found) return found;
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return null;
}

function findLogo(node: unknown): string | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findLogo(n);
      if (f) return f;
    }
    return null;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const logo = obj.logo;
    if (typeof logo === "string" && /^https?:\/\//i.test(logo)) return logo;
    if (logo && typeof logo === "object") {
      const url = (logo as Record<string, unknown>).url;
      if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") {
        const f = findLogo(v);
        if (f) return f;
      }
    }
  }
  return null;
}

export async function crawlSite(inputUrl: string): Promise<CrawlResult> {
  const base = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`;
  let origin = base;
  try {
    origin = new URL(base).origin;
  } catch {
    /* keep base */
  }

  const home = await fetchPage(base);
  let pages = home.ok ? 1 : 0;
  const html = home.html;
  const finalBase = home.finalUrl || base;

  // Best-effort secondary pages (parallel, short timeout).
  const [contact, pricing] = await Promise.all([
    fetchPage(`${origin}/contact`, 8000),
    fetchPage(`${origin}/pricing`, 8000),
  ]);
  if (contact.ok) pages++;
  if (pricing.ok) pages++;

  const contactHtml = contact.ok ? contact.html : "";
  const combined = html + "\n" + contactHtml + "\n" + (pricing.ok ? pricing.html : "");

  // --- Title / description / name ---
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()).slice(0, 250) : null;
  const metaDescription =
    metaContent(html, "description") || metaContent(html, "og:description", "property");
  const siteName =
    metaContent(html, "og:site_name", "property") ||
    metaContent(html, "application-name") ||
    (title ? title.split(/[|\-—·:]/)[0].trim() : null);

  // --- Favicon (prefer apple-touch-icon, then rel="icon", then /favicon.ico) ---
  const appleIcon = /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(html);
  const faviconRel =
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(html);
  const faviconUrl =
    (appleIcon && abs(finalBase, appleIcon[1])) ||
    (faviconRel && abs(finalBase, faviconRel[1])) ||
    abs(finalBase, "/favicon.ico");

  // --- Logo, best source first ---
  //   1. schema.org Organization "logo"
  //   2. an <img> whose class/id/alt/src mentions "logo" (incl. lazy data-src)
  //   3. apple-touch-icon (usually a clean square mark)
  //   4. og:image (last resort — often a social banner)
  const jsonLdLogo = extractJsonLdLogo(html);
  const logoImg =
    /<img\b[^>]*(?:class|id|alt|src|data-src)=["'][^"']*logo[^"']*["'][^>]*>/i.exec(html)?.[0];
  const logoSrc = logoImg
    ? (/(?:data-src|src)=["']([^"']+)["']/i.exec(logoImg)?.[1] ??
       /srcset=["']([^"'\s]+)/i.exec(logoImg)?.[1])
    : null;
  const cleanLogoSrc =
    logoSrc && !logoSrc.startsWith("data:") && !/\.svg#/.test(logoSrc) ? logoSrc : null;
  const ogImage = metaContent(html, "og:image", "property");
  const logoUrl =
    (jsonLdLogo && abs(finalBase, jsonLdLogo)) ||
    (cleanLogoSrc && abs(finalBase, cleanLogoSrc)) ||
    (appleIcon && abs(finalBase, appleIcon[1])) ||
    (ogImage ? abs(finalBase, ogImage) : null);

  // --- Colors: theme-color + hex codes seen in inline styles / style blocks ---
  const themeColor = metaContent(html, "theme-color");
  const hexes = [...html.matchAll(/#([0-9a-fA-F]{6})\b/g)].map((x) => `#${x[1].toLowerCase()}`);
  const colorCounts = new Map<string, number>();
  for (const h of hexes) colorCounts.set(h, (colorCounts.get(h) || 0) + 1);
  const topColors = [...colorCounts.entries()]
    .filter(([c]) => !["#ffffff", "#000000", "#fff", "#000"].includes(c))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c]) => c);
  const colors = uniq([themeColor || "", ...topColors].filter(Boolean) as string[], 6);

  // --- Fonts: Google Fonts links + font-family declarations ---
  const gfonts = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)].map((x) =>
    decodeURIComponent(x[1]).replace(/\+/g, " ").split(":")[0]
  );
  const famDecl = [...combined.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)]
    .map((x) => x[1].split(",")[0].replace(/['"]/g, "").trim())
    .filter((f) => f && !/^(inherit|initial|sans-serif|serif|monospace|var\()/i.test(f));
  const fonts = uniq([...gfonts, ...famDecl], 5);

  // --- Contacts ---
  const emails = uniq(
    [
      ...[...combined.matchAll(/mailto:([^"'?]+)/gi)].map((x) => x[1]),
      ...[...combined.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map((x) => x[0]),
    ].filter((e) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)),
    5
  );
  const phones = uniq(
    [
      ...[...combined.matchAll(/tel:([+\d][\d\s().-]{5,})/gi)].map((x) => x[1]),
      ...[...combined.matchAll(/(\+?\d[\d\s().-]{7,}\d)/g)].map((x) => x[1]),
    ],
    4
  );

  // --- Languages ---
  const htmlLang = /<html[^>]+lang=["']([^"']+)["']/i.exec(html)?.[1];
  const hreflangs = [...html.matchAll(/hreflang=["']([^"']+)["']/gi)].map((x) => x[1]);
  const languages = uniq([htmlLang || "", ...hreflangs].filter(Boolean) as string[], 6).map((l) =>
    l.toLowerCase()
  );

  // --- Currencies (symbols + ISO codes near numbers) ---
  const curCodes = [...combined.matchAll(/\b(USD|EUR|GBP|CAD|AUD|JPY|INR|BRL|MXN|SGD|CHF)\b/g)].map(
    (x) => x[1]
  );
  const curSymbols: string[] = [];
  if (/\$\s?\d/.test(combined)) curSymbols.push("USD");
  if (/€\s?\d|\d\s?€/.test(combined)) curSymbols.push("EUR");
  if (/£\s?\d/.test(combined)) curSymbols.push("GBP");
  const currencies = uniq([...curCodes, ...curSymbols], 4);

  // --- Primary CTA: first prominent button/link text ---
  const ctaCandidates = [...html.matchAll(/<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi)]
    .map((x) => decodeEntities(x[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter(
      (t) =>
        t.length >= 3 &&
        t.length <= 30 &&
        /(get started|sign up|start|try|buy|book|demo|join|subscribe|shop|contact)/i.test(t)
    );
  const primaryCta = ctaCandidates[0] || null;

  // --- Products / services / pricing headings (heuristic) ---
  const headings = [...combined.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((x) => decodeEntities(x[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= 3 && t.length <= 80);
  const products = uniq(
    headings.filter((h) => /product|feature|plan|package/i.test(h)),
    6
  );
  const services = uniq(
    headings.filter((h) => /service|solution|offering|consult/i.test(h)),
    6
  );
  const priceMatches = uniq(
    [...combined.matchAll(/(?:[$€£]\s?\d[\d,.]*(?:\s?\/\s?(?:mo|month|yr|year|user))?)/gi)].map(
      (x) => x[0].replace(/\s+/g, " ").trim()
    ),
    8
  );

  return {
    name: siteName ? siteName.slice(0, 200) : null,
    logoUrl: logoUrl || null,
    faviconUrl: faviconUrl || null,
    title,
    metaDescription: metaDescription ? metaDescription.slice(0, 500) : null,
    primaryCta,
    colors,
    fonts,
    products,
    services,
    pricing: priceMatches,
    emails,
    phones,
    addresses: [],
    languages,
    currencies,
    pagesCrawled: pages,
    homepageHtml: html.slice(0, 300_000),
    contactHtml: contactHtml.slice(0, 100_000),
  };
}

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

const PAGE_TIMEOUT_MS = 4_000;
const SOCIAL_HOST =
  /(?:^|\.)(facebook|instagram|twitter|x|linkedin|youtube|tiktok|pinterest)\.com$|^(?:facebook|instagram|linkedin|youtube|tiktok|pinterest)$/i;

function isSocialHref(href: string): boolean {
  try {
    const host = new URL(href, "https://example.com").hostname.replace(/^www\./, "");
    return SOCIAL_HOST.test(host);
  } catch {
    return SOCIAL_HOST.test(href);
  }
}

function isSocialLabel(text: string): boolean {
  return /^(facebook|instagram|twitter|x|linkedin|youtube|tiktok|pinterest|follow us)$/i.test(
    text.trim(),
  );
}

function validPhone(raw: string): string | null {
  if (/[a-z.]/i.test(raw)) return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (/^0+$/.test(digits)) return null;
  const shortTokens = trimmed.split(/[\s()-]+/).filter((token) => /^\d{1,2}$/.test(token));
  if (shortTokens.length >= 3) return null;
  const prefix = trimmed.trim().startsWith("+") ? "+" : "";
  return `${prefix}${digits}`.slice(0, 16);
}

function hexOf(raw: string): string | null {
  const m = raw.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const hex = `#${m[1].toLowerCase()}`;
  if (hex === "#ffffff" || hex === "#000000") return null;
  return hex;
}

function rgbToHex(body: string): string | null {
  const m = body.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (!m) return null;
  const parts = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (parts.some((n) => n > 255)) return null;
  const hex = `#${parts.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  return hex === "#ffffff" || hex === "#000000" ? null : hex;
}

async function fetchPage(
  url: string,
  timeoutMs = PAGE_TIMEOUT_MS
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
    const textLike =
      ct.includes("text/html") ||
      ct.includes("xml") ||
      ct.includes("text/plain") ||
      ct.includes("text/css") ||
      ct.includes("javascript");
    if (ct && !textLike) {
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
  const html = home.html;
  const finalBase = home.finalUrl || base;
  try {
    origin = new URL(finalBase).origin;
  } catch {
    /* keep the input origin */
  }
  const pageBodies: string[] = home.ok ? [home.html] : [];

  const extraPaths = ["/about", "/about-us", "/pricing", "/services", "/contact", "/contact-us"];
  let cursor = 0;
  async function nextExtra() {
    while (pageBodies.length < 5 && cursor < extraPaths.length) {
      const path = extraPaths[cursor++];
      const page = await fetchPage(`${origin}${path}`);
      if (page.ok && page.html) pageBodies.push(page.html);
    }
  }
  await Promise.all([nextExtra(), nextExtra()]);

  const pages = pageBodies.length;
  const contactHtml = pageBodies.find((body) => /contact/i.test(body.slice(0, 500))) || pageBodies[1] || "";
  const combined = pageBodies.join("\n");

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

  // --- Colors: theme-color, CSS variables, then one same-origin stylesheet ---
  let extraCss = "";
  const colorBag: string[] = [];
  const pushColor = (value: string | null | undefined) => {
    if (!value) return;
    const hex = hexOf(value) || (value.includes(",") ? rgbToHex(value) : null);
    if (hex) colorBag.push(hex);
  };
  pushColor(metaContent(html, "theme-color"));
  for (const match of combined.matchAll(
    /--(?:color-)?(?:primary|brand|accent|secondary)[^:]*:\s*([^;}{]+)/gi,
  )) {
    pushColor(match[1]);
  }
  for (const match of combined.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    pushColor(`#${match[1]}`);
  }
  if (colorBag.length === 0) {
    const sheetHref = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1];
    const sheetUrl = sheetHref ? abs(finalBase, sheetHref) : null;
    if (sheetUrl && sheetUrl.startsWith(origin)) {
      const sheet = await fetchPage(sheetUrl, 3_000);
      if (sheet.ok) {
        extraCss = sheet.html;
        for (const match of sheet.html.matchAll(
          /--(?:color-)?(?:primary|brand|accent)[^:]*:\s*([^;}{]+)/gi,
        )) {
          pushColor(match[1]);
        }
        for (const match of sheet.html.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
          pushColor(`#${match[1]}`);
        }
      }
    }
  }
  if (colorBag.length === 0 && logoUrl && /\.svg($|\?)/i.test(logoUrl)) {
    const logo = await fetchPage(logoUrl, 3_000);
    if (logo.ok) {
      for (const match of logo.html.matchAll(
        /(?:fill|stroke)=["']#([0-9a-fA-F]{6})["']/gi,
      )) {
        pushColor(`#${match[1]}`);
      }
    }
  }
  const colors = uniq(colorBag, 6);

  // --- Fonts: Google Fonts links + font-family declarations ---
  const gfonts = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)].map((x) =>
    decodeURIComponent(x[1]).replace(/\+/g, " ").split(":")[0]
  );
  const famDecl = [...`${combined}\n${extraCss}`.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)]
    .map((x) => x[1].split(",")[0].replace(/['"]/g, "").trim())
    .filter(
      (f) =>
        f &&
        !/^(inherit|initial|sans-serif|serif|monospace|system-ui|ui-|emoji|var\()/i.test(f),
    );
  const fonts = uniq([...gfonts, ...famDecl], 5);

  // --- Contacts ---
  const emails = uniq(
    [
      ...[...combined.matchAll(/mailto:([^"'?]+)/gi)].map((x) => x[1]),
      ...[...combined.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map((x) => x[0]),
    ].filter((e) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)),
    5
  );
  const visibleText = combined
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const phones = uniq(
    [
      ...[...combined.matchAll(/tel:([^"'?\s]+)/gi)].map((x) =>
        validPhone(decodeURIComponent(x[1])),
      ),
      ...[...visibleText.matchAll(/(?:\+|00)?\d[\d\s().-]{8,}\d/g)].map((x) =>
        validPhone(x[0]),
      ),
    ].filter((p): p is string => Boolean(p)),
    4,
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

  // --- Primary CTA: first prominent button/link that is not a social profile ---
  const ctaCandidates = [
    ...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi),
  ]
    .map((x) => {
      const attrs = x[2] || "";
      const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1] || "";
      const text = decodeEntities(x[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      return { text, href };
    })
    .filter(
      (c) =>
        c.text.length >= 3 &&
        c.text.length <= 30 &&
        !isSocialLabel(c.text) &&
        !isSocialHref(c.href) &&
        /(get started|sign up|start|try|buy|book|demo|join|subscribe|shop|contact|quote)/i.test(
          c.text,
        ),
    );
  const primaryCta = ctaCandidates[0]?.text || null;

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

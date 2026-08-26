/**
 * Brand slug rules shared by the browser and the server.
 *
 * This module must stay free of Prisma so client components can normalize and
 * preview a slug without pulling the database client into the browser bundle.
 * Anything that needs to touch `member_urls` lives in `brand-access.ts`.
 */

export const SLUG_MIN_LENGTH = 3;

/** `member_urls.slug` is VARCHAR(100). */
export const SLUG_MAX_LENGTH = 100;

/** Roots stop short of the column limit so a `-<n>` suffix always fits. */
export const SLUG_ROOT_MAX_LENGTH = 80;

/**
 * Slugs that would shadow a real route or read as a system path under
 * `/p/<slug>`. Kept deliberately small so real brand names are never blocked.
 */
const RESERVED_SLUGS = new Set([
  "_next",
  "admin",
  "api",
  "assets",
  "campaign",
  "edit",
  "favicon",
  "new",
  "null",
  "p",
  "participants",
  "public",
  "robots",
  "sitemap",
  "static",
  "undefined",
  "widget",
  "www",
]);

export type SlugIssue =
  "empty" | "too-short" | "too-long" | "numeric" | "reserved";

export type SlugReason = SlugIssue | "taken" | "ok";

export interface SlugCheckResult {
  /** The normalized slug that was checked. */
  slug: string;
  available: boolean;
  reason: SlugReason;
  /** Human-readable copy, safe to render directly. */
  message: string;
  /** Next free slug when `slug` cannot be used, otherwise `null`. */
  suggestion: string | null;
  /** Public path for `slug` (or `suggestion` when unavailable). */
  publicPath: string;
}

/** Legacy normalizer kept for callers that still allow underscores. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

/** Public URL slug from a domain: blacksesameph.com → blacksesameph-com */
export function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_ROOT_MAX_LENGTH);
}

/** Coerce free-form input into the only shape we ever store. */
export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_ROOT_MAX_LENGTH)
    .replace(/-+$/, "");
}

/**
 * Normalizer for a live input. Identical to `normalizeSlug` except it keeps one
 * trailing separator, otherwise the dash is eaten the moment it is typed and
 * multi-word slugs become impossible to enter.
 */
export function normalizeSlugInput(value: string): string {
  const normalized = normalizeSlug(value);
  const endsWithSeparator = /[^a-z0-9]$/i.test(value);
  if (!normalized || !endsWithSeparator) return normalized;
  return `${normalized}-`.slice(0, SLUG_ROOT_MAX_LENGTH);
}

/** Slug a member would get from a pasted website: https://www.acme.co/x → acme-co */
export function slugFromWebsite(value: string): string {
  const host = value
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0];
  return normalizeSlug(host);
}

/**
 * Why a normalized slug cannot be used, or `null` when the shape is fine.
 * This says nothing about whether another brand already holds it.
 */
export function slugIssue(slug: string): SlugIssue | null {
  if (!slug) return "empty";
  if (slug.length < SLUG_MIN_LENGTH) return "too-short";
  if (slug.length > SLUG_MAX_LENGTH) return "too-long";
  // `/p/<digits>` resolves by brand id, so a numeric slug is unreachable.
  if (/^\d+$/.test(slug)) return "numeric";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return null;
}

export function slugIssueMessage(issue: SlugIssue): string {
  switch (issue) {
    case "empty":
      return "Enter a website first — we'll build the address from it.";
    case "too-short":
      return `Use at least ${SLUG_MIN_LENGTH} characters.`;
    case "too-long":
      return `Use at most ${SLUG_MAX_LENGTH} characters.`;
    case "numeric":
      return "Numbers-only addresses are reserved. Add a word, like acme-2026.";
    case "reserved":
      return "That address is reserved. Try adding your brand name.";
  }
}

export function publicBrandPath(slug: string): string {
  return `/p/${slug}`;
}

/** Host shown in slug previews, e.g. "referrals.com". */
export const PUBLIC_BRAND_HOST = (
  process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com"
)
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");

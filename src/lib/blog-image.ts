/** Blog cover image helpers — pure, so both server and client code can import them. */

export const BLOG_IMAGE_FALLBACK = "/images/blog/placeholder.svg";

/**
 * Canonical origin for blog images.
 *
 * Hardcoded rather than read from the environment so social crawlers always
 * resolve a production URL, matching the canonical links the blog pages emit.
 */
const SITE_URL = "https://referrals.com";

/**
 * Absolute form of a cover image path.
 *
 * Covers are stored site-relative ("/images/blog/<slug>.jpg"), but OpenGraph,
 * Twitter cards, JSON-LD, and RSS enclosures all reject relative URLs. Posts
 * written before covers were self-hosted still hold a full external URL, so
 * those are passed through untouched.
 */
export function absoluteBlogImageUrl(src: string | null | undefined): string {
  const raw = (src ?? "").trim();
  if (!raw) return `${SITE_URL}${BLOG_IMAGE_FALLBACK}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

/** MIME type for a cover, for RSS enclosures. Defaults to JPEG. */
export function blogImageMimeType(src: string): string {
  const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

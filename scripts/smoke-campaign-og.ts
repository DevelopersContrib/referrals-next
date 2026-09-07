/**
 * Public campaign OG preview smoke (R5).
 * Mimics what Slack / iMessage crawlers read from the page HTML.
 *
 * Offline — metadata builder + sitemap wiring:
 *   npx tsx scripts/smoke-campaign-og.ts
 *
 * Live — fetch public campaign URL + validate og:image is reachable:
 *   npx tsx scripts/smoke-campaign-og.ts --live
 *   npx tsx scripts/smoke-campaign-og.ts --live --url https://www.referrals.com/p/liamcom/campaign/146
 *
 * Live sitemap — public campaign URLs listed:
 *   npx tsx scripts/smoke-campaign-og.ts --live --sitemap --base-url https://www.referrals.com
 */
import { readFileSync } from "fs";
import { join } from "path";
import { buildPublicCampaignMetadata } from "../src/components/campaigns/public-campaign-page";
import type { PublicCampaignViewPayload } from "../src/lib/public-campaign-server";

const DEFAULT_LIVE_URL =
  "https://www.referrals.com/p/liamcom/campaign/146";

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function mockPayload(heroImageUrl: string | null): PublicCampaignViewPayload {
  return {
    brand: {
      id: 1,
      domain: "example.com",
      slug: "examplecom",
      logo_url: null,
    },
    campaign: {
      id: 99,
      name: "Smoke Campaign",
      url_id: 1,
      headline: "Share and earn rewards",
      pitch: "Refer friends and unlock perks.",
      landing: null,
    },
    participantCount: 0,
    topSharers: [],
    participantMap: new Map(),
    totalClicks: 0,
    showBranding: true,
    accentFrom: "#FF5C62",
    accentTo: "#926efb",
    rewardLabel: "$5 cash",
    buttonText: "Join",
    launchChannels: [],
    snippets: [],
    heroImageUrl,
    designStyle: "hero",
  };
}

function firstOgImageUrl(
  images: NonNullable<NonNullable<ReturnType<typeof buildPublicCampaignMetadata>["openGraph"]>["images"]> | undefined
): string {
  if (!images) return "";
  const list = Array.isArray(images) ? images : [images];
  for (const item of list) {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "url" in item && item.url) {
      return String(item.url);
    }
  }
  return "";
}

function metadataTwitterCard(
  twitter: ReturnType<typeof buildPublicCampaignMetadata>["twitter"]
): string | undefined {
  if (!twitter || typeof twitter !== "object") return undefined;
  const card = (twitter as { card?: unknown }).card;
  return typeof card === "string" ? card : undefined;
}

function metadataTwitterImages(
  twitter: ReturnType<typeof buildPublicCampaignMetadata>["twitter"]
): string {
  if (!twitter || typeof twitter !== "object") return "";
  const images = (twitter as { images?: unknown }).images;
  if (typeof images === "string") return images;
  if (Array.isArray(images)) return String(images[0] || "");
  return "";
}

function checkMetadataBuilder() {
  console.log("\n1. buildPublicCampaignMetadata");

  const heroUrl = "https://cdn.example.com/campaign-hero.jpg";
  const withHero = buildPublicCampaignMetadata(mockPayload(heroUrl));
  const ogImageUrl = firstOgImageUrl(withHero.openGraph?.images);

  if (ogImageUrl !== heroUrl) {
    fail(`openGraph.images missing hero (${ogImageUrl || "empty"})`);
  }
  pass(`openGraph.images → ${ogImageUrl}`);

  const twitterCard = metadataTwitterCard(withHero.twitter);
  if (twitterCard !== "summary_large_image") {
    fail(`expected twitter:card summary_large_image, got ${twitterCard ?? "none"}`);
  }
  pass("twitter:card → summary_large_image");

  const twitterImageUrl = metadataTwitterImages(withHero.twitter);
  if (twitterImageUrl !== heroUrl) {
    fail(`twitter.images missing hero (${twitterImageUrl || "empty"})`);
  }
  pass(`twitter.images → ${twitterImageUrl}`);

  const withoutHero = buildPublicCampaignMetadata(mockPayload(null));
  if (withoutHero.openGraph?.images) {
    fail("openGraph.images should be omitted when heroImageUrl is null");
  }
  if (metadataTwitterCard(withoutHero.twitter) === "summary_large_image") {
    fail("twitter large-image card should not be set without hero");
  }
  pass("no hero → no og:image / large-image twitter card");
}

function checkSitemapWiring() {
  console.log("\n2. Sitemap includes public campaign URLs");
  const src = readFileSync(join(process.cwd(), "src/app/sitemap.xml/route.ts"), "utf8");

  if (!src.includes('publish: "public"')) {
    fail('sitemap route must query publish: "public" campaigns');
  }
  pass('sitemap queries publish: "public" campaigns');

  if (!src.includes("/p/${slug}/campaign/${c.id}")) {
    fail("sitemap must emit /p/{slug}/campaign/{id} URLs");
  }
  pass("sitemap emits /p/{slug}/campaign/{id} URLs");
}

async function checkLiveSitemap(baseUrl: string) {
  console.log("\n4. Sitemap live fetch");
  const url = `${baseUrl.replace(/\/+$/, "")}/sitemap.xml`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    fail(`sitemap fetch failed (${res.status}): ${url}`);
  }
  pass(`sitemap ${res.status} → ${url}`);

  const xml = await res.text();
  const campaignPath = xml.match(/\/p\/[^<]+\/campaign\/\d+/);
  if (!campaignPath) {
    fail("sitemap.xml contains no /p/{slug}/campaign/{id} entries");
  }
  pass(`sample campaign URL in sitemap: ${campaignPath[0]}`);
}

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function isAbsoluteHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function checkImageReachable(imageUrl: string) {
  const res = await fetch(imageUrl, { method: "GET", redirect: "follow" });
  if (!res.ok) {
    fail(`og:image not reachable (${res.status}): ${imageUrl}`);
  }
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) {
    fail(`og:image content-type is not image/* (${type || "unknown"}): ${imageUrl}`);
  }
  pass(`og:image reachable (${res.status}, ${type})`);
}

async function runLive() {
  const url = (arg("url", DEFAULT_LIVE_URL) || DEFAULT_LIVE_URL).trim();
  const baseUrl = (
    arg("base-url", process.env.NEXT_PUBLIC_APP_URL || "https://www.referrals.com") ||
    "https://www.referrals.com"
  ).trim();
  console.log("\n=== Campaign OG live smoke ===");
  console.log(`url: ${url}`);

  checkMetadataBuilder();
  checkSitemapWiring();

  if (hasFlag("sitemap")) {
    await checkLiveSitemap(baseUrl);
    console.log("\nSitemap live checks passed.\n");
    return;
  }

  console.log("\n3. Fetch public page (Slack / iMessage crawler path)");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    fail(`page fetch failed (${res.status})`);
  }
  pass(`page ${res.status} → ${res.url}`);

  const html = await res.text();
  const ogTitle = metaContent(html, "og:title");
  const ogDescription = metaContent(html, "og:description");
  const ogImage = metaContent(html, "og:image");
  const ogType = metaContent(html, "og:type");
  const twitterCard = metaContent(html, "twitter:card");
  const twitterImage = metaContent(html, "twitter:image");

  if (!ogTitle?.trim()) fail("missing og:title");
  pass(`og:title → ${ogTitle}`);

  if (!ogDescription?.trim()) fail("missing og:description");
  pass(`og:description → ${ogDescription.slice(0, 80)}${ogDescription.length > 80 ? "…" : ""}`);

  if (ogType !== "website") fail(`expected og:type website, got ${ogType ?? "none"}`);
  pass("og:type → website");

  if (!ogImage?.trim()) {
    fail(
      "missing og:image — campaign may have no banner_image_url; pick a launched campaign with a hero or pass --url"
    );
  }
  if (!isAbsoluteHttpUrl(ogImage)) {
    fail(`og:image must be absolute URL: ${ogImage}`);
  }
  pass(`og:image → ${ogImage}`);

  if (twitterCard !== "summary_large_image") {
    fail(`expected twitter:card summary_large_image, got ${twitterCard ?? "none"}`);
  }
  pass("twitter:card → summary_large_image");

  if (twitterImage && twitterImage !== ogImage) {
    console.log(`NOTE: twitter:image (${twitterImage}) differs from og:image — Slack uses og:image`);
  } else if (twitterImage) {
    pass(`twitter:image → ${twitterImage}`);
  }

  console.log("\n4. Image fetch (preview card requirement)");
  await checkImageReachable(ogImage);

  console.log("\nAll live OG checks passed.");
  console.log("Manual optional: paste the URL into Slack or iMessage — preview should match og:title + hero image.");
  console.log(`  ${url}\n`);
}

async function main() {
  if (hasFlag("live")) {
    await runLive();
    return;
  }

  console.log("\n=== Campaign OG smoke (offline) ===");
  checkMetadataBuilder();
  checkSitemapWiring();
  console.log("\nOffline checks passed.");
  console.log("Live crawler + image fetch:");
  console.log(`  npx tsx scripts/smoke-campaign-og.ts --live --url ${DEFAULT_LIVE_URL}`);
  console.log("Live sitemap:");
  console.log("  npx tsx scripts/smoke-campaign-og.ts --live --sitemap --base-url https://www.referrals.com\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

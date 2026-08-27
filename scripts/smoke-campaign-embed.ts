/**
 * J5 — Full-page campaign embed snippet smoke.
 *
 * Offline — snippet builder:
 *   npx tsx scripts/smoke-campaign-embed.ts
 *
 * Live — fetch campaign 21562 / blacksesameph-com and confirm the page
 * is iframe-friendly (no X-Frame-Options DENY/SAMEORIGIN) and campaign
 * data renders:
 *   npx tsx scripts/smoke-campaign-embed.ts --live
 *   npx tsx scripts/smoke-campaign-embed.ts --live --url https://www.referrals.com/p/blacksesameph-com/campaign/21562
 */
import {
  buildCampaignEmbedSnippets,
  publicCampaignUrl,
} from "../src/lib/campaign-embed-snippets";

const SMOKE_SLUG = "blacksesameph-com";
const SMOKE_CAMPAIGN_ID = 21562;
const DEFAULT_LIVE_URL = `https://www.referrals.com/p/${SMOKE_SLUG}/campaign/${SMOKE_CAMPAIGN_ID}`;

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

function checkSnippetBuilder() {
  console.log("\n1. buildCampaignEmbedSnippets");

  const widgetOnly = buildCampaignEmbedSnippets(
    "https://referrals.com",
    SMOKE_CAMPAIGN_ID,
  );
  if (!widgetOnly.js.includes(`/widget.js?campaign=${SMOKE_CAMPAIGN_ID}`)) {
    fail("js snippet missing widget.js loader");
  }
  if (!widgetOnly.iframe.includes(`/widget/${SMOKE_CAMPAIGN_ID}/embed`)) {
    fail("widget iframe snippet missing /widget/{id}/embed");
  }
  if (widgetOnly.fullPage) {
    fail("fullPage snippet should be empty without a slug");
  }
  pass("widget js + iframe stay without a slug; fullPage omitted");

  const withSlug = buildCampaignEmbedSnippets(
    "https://referrals.com/",
    SMOKE_CAMPAIGN_ID,
    SMOKE_SLUG,
  );
  const expectedPage = publicCampaignUrl(
    "https://referrals.com/",
    SMOKE_SLUG,
    SMOKE_CAMPAIGN_ID,
  );
  if (
    expectedPage !==
    `https://referrals.com/p/${SMOKE_SLUG}/campaign/${SMOKE_CAMPAIGN_ID}`
  ) {
    fail(`publicCampaignUrl mismatch: ${expectedPage}`);
  }
  if (withSlug.pageUrl !== expectedPage) {
    fail(`pageUrl mismatch: ${withSlug.pageUrl}`);
  }
  if (!withSlug.fullPage.includes(`src="${expectedPage}"`)) {
    fail("fullPage iframe src is not /p/{slug}/campaign/{id}");
  }
  if (!withSlug.fullPage.includes("min-height:100vh")) {
    fail("fullPage iframe should use min-height 100vh");
  }
  if (!withSlug.iframe.includes(`/widget/${SMOKE_CAMPAIGN_ID}/embed`)) {
    fail("widget iframe must still be present next to fullPage");
  }
  if (!withSlug.js.includes(`/widget.js?campaign=${SMOKE_CAMPAIGN_ID}`)) {
    fail("js widget snippet must still be present next to fullPage");
  }
  pass(`fullPage → ${expectedPage}`);
  pass("widget js + iframe unchanged alongside fullPage");
}

function frameBlocked(headers: Headers): string | null {
  const xfo = (headers.get("x-frame-options") || "").toLowerCase();
  if (xfo.includes("deny") || xfo.includes("sameorigin")) {
    return `X-Frame-Options: ${headers.get("x-frame-options")}`;
  }
  const csp = headers.get("content-security-policy") || "";
  const frameAncestors = /frame-ancestors\s+([^;]+)/i.exec(csp);
  if (!frameAncestors) return null;
  const value = frameAncestors[1].trim().toLowerCase();
  if (
    value === "'none'" ||
    value === "none" ||
    value === "'self'" ||
    value === "self"
  ) {
    return `CSP frame-ancestors ${frameAncestors[1].trim()}`;
  }
  return null;
}

async function runLive() {
  const url = (arg("url", DEFAULT_LIVE_URL) || DEFAULT_LIVE_URL).trim();
  console.log("\n=== Full-page campaign embed live smoke ===");
  console.log(`url: ${url}`);

  checkSnippetBuilder();

  console.log("\n2. Fetch public campaign (iframe src)");
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    fail(`page fetch failed (${res.status})`);
  }
  pass(`page ${res.status} → ${res.url}`);

  const blocked = frameBlocked(res.headers);
  if (blocked) {
    fail(`public campaign is not iframe-friendly (${blocked})`);
  }
  const csp = res.headers.get("content-security-policy");
  pass(
    csp
      ? `framing allowed (${csp})`
      : "no X-Frame-Options / frame-ancestors — framing allowed by default",
  );

  const html = await res.text();
  if (html.length < 400) {
    fail(`page HTML too short to be a campaign landing (${html.length} chars)`);
  }
  const looksLikeCampaign =
    /campaign/i.test(html) &&
    (/participant/i.test(html) || /refer/i.test(html) || /join/i.test(html));
  if (!looksLikeCampaign) {
    fail(
      "HTML does not look like a public campaign page (missing campaign/join copy)",
    );
  }
  pass("campaign landing HTML rendered");

  console.log("\nAll live embed checks passed.");
  console.log(
    "Manual: paste the full-page iframe into a blank HTML file and confirm it loads.",
  );
  console.log(`  ${url}\n`);
}

async function main() {
  if (hasFlag("live")) {
    await runLive();
    return;
  }

  console.log("\n=== Full-page campaign embed smoke (offline) ===");
  checkSnippetBuilder();
  console.log("\nOffline checks passed.");
  console.log("Live iframe-friendliness + campaign render:");
  console.log(
    `  npx tsx scripts/smoke-campaign-embed.ts --live --url ${DEFAULT_LIVE_URL}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

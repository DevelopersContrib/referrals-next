/**
 * AI campaign launch smoke (offline).
 *
 *   npx tsx scripts/smoke-campaign-launch.ts
 *
 * Validates:
 *  - launch route has try/catch + structured logging
 *  - launch route sanitizes AI text for MySQL latin1 columns
 *  - launch route uses 402 for explicit publish-public-when-unpaid
 *  - launch route does NOT embed checkoutUrl in 201 success response
 *  - client always navigates to the campaign page on success (no billing redirect)
 *  - client handles non-JSON 500 responses gracefully
 *  - client surfaces specific error messages from the API
 *  - stripFancy is exported and correctly strips non-ASCII
 */
import { readFileSync } from "fs";
import { join } from "path";
import { stripFancy } from "../src/lib/analysis/apply-campaign-suggestion";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function readRepoFile(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

function main() {
  console.log("\n=== AI campaign launch smoke (offline) ===\n");

  // --- stripFancy unit checks ---
  const plain = stripFancy("Hello World");
  if (plain !== "Hello World") fail(`stripFancy("Hello World") = "${plain}"`);
  pass("stripFancy preserves ASCII");

  const fancy = stripFancy("Join — earn rewards™! 🎉");
  if (/[^\x09\x0A\x0D\x20-\x7E]/.test(fancy)) {
    fail(`stripFancy left non-ASCII: "${fancy}"`);
  }
  if (!fancy.includes("Join")) fail(`stripFancy dropped too much: "${fancy}"`);
  pass("stripFancy strips non-ASCII (em dash, TM, emoji)");

  const empty = stripFancy("");
  if (empty !== "") fail(`stripFancy("") = "${empty}"`);
  pass("stripFancy handles empty string");

  // --- Server route checks ---
  const launch = readRepoFile(
    "src/app/api/brands/analyze/[jobId]/launch/route.ts",
  );

  if (!launch.includes("try {")) {
    fail("launch route must have try/catch error handling");
  }
  pass("launch route has try/catch");

  if (!launch.includes("[campaign-launch]")) {
    fail('launch route must log with "[campaign-launch]" prefix');
  }
  pass("launch route has structured logging");

  if (!launch.includes("console.error")) {
    fail("launch route must log errors with console.error");
  }
  pass("launch route logs errors to console.error");

  if (!launch.includes("safe(")) {
    fail("launch route must sanitize text with safe()");
  }
  pass("launch route sanitizes text fields");

  if (!launch.includes("stripFancy")) {
    fail("launch route must use stripFancy for latin1 safety");
  }
  pass("launch route uses stripFancy");

  if (!launch.includes("isVnocBrand")) {
    fail("launch route must check VNOC status");
  }
  pass("launch route checks VNOC brand status");

  if (!launch.includes('{ status: 402 }') && !launch.includes("status: 402")) {
    fail("launch route must return 402 for explicit publish-public-when-unpaid");
  }
  pass("launch route returns 402 for explicit publish-public-when-unpaid");

  if (!launch.includes("REQUIRES_SUBSCRIPTION")) {
    fail("launch route must return REQUIRES_SUBSCRIPTION code on 402");
  }
  pass("launch route returns REQUIRES_SUBSCRIPTION code on 402");

  // Success response must NOT contain checkoutUrl (campaign page shows Go Live)
  const successReturn = launch.slice(
    launch.lastIndexOf("return NextResponse.json"),
  );
  if (successReturn.includes("checkoutUrl")) {
    fail("launch 201 success response must NOT contain checkoutUrl (campaign page shows Go Live CTA)");
  }
  pass("launch 201 success response does not contain checkoutUrl");

  // --- Client checks ---
  const picker = readRepoFile("src/components/campaigns/ai-campaign-picker.tsx");

  if (!picker.includes(".json().catch(")) {
    fail("client must handle non-JSON responses gracefully");
  }
  pass("client handles non-JSON 500 responses");

  if (!picker.includes('typeof data.error === "string"')) {
    fail("client must surface specific error messages from API");
  }
  pass("client surfaces specific API error messages");

  // Client must NOT auto-redirect to billing/checkout on success
  const launchFn = picker.slice(
    picker.indexOf("async function launch("),
    picker.indexOf("const campaigns = status"),
  );
  if (launchFn.includes("checkoutUrl")) {
    fail("client launch function must NOT redirect to checkoutUrl (campaign page shows Go Live CTA)");
  }
  pass("client launch function does not redirect to billing/checkoutUrl");

  // Client must always navigate to the campaign page on success
  if (!launchFn.includes("data.brandId}/campaigns/${data.campaignId}")) {
    fail("client must navigate to /brands/{brandId}/campaigns/{campaignId} on success");
  }
  pass("client navigates to campaign page on success");

  // --- Manual campaign wizard checks ---
  const wizard = readRepoFile("src/components/campaigns/campaign-wizard.tsx");
  if (!wizard.includes("toast.success")) {
    fail("campaign wizard must show success toast after creation");
  }
  pass("campaign wizard shows success toast");

  if (!wizard.includes("setCreatedCampaignId")) {
    fail("campaign wizard must set created campaign ID (shows integration panel)");
  }
  pass("campaign wizard shows integration panel after creation");

  // --- Campaign page Go Live button ---
  const campaignPage = readRepoFile(
    "src/app/(dashboard)/brands/[brandId]/campaigns/[campaignId]/page.tsx",
  );
  if (!campaignPage.includes("CampaignGoLiveButton")) {
    fail("campaign page must render CampaignGoLiveButton for draft campaigns");
  }
  pass("campaign page renders CampaignGoLiveButton");

  // --- apply-campaign-suggestion export ---
  const acs = readRepoFile("src/lib/analysis/apply-campaign-suggestion.ts");
  if (!acs.includes("export function stripFancy")) {
    fail("stripFancy must be exported from apply-campaign-suggestion");
  }
  pass("stripFancy is exported");

  console.log("\nAll offline checks passed.\n");
}

main();

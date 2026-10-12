/**
 * AI campaign launch smoke (offline).
 *
 *   npx tsx scripts/smoke-campaign-launch.ts
 *
 * Validates:
 *  - launch route has try/catch + structured logging
 *  - launch route sanitizes AI text for MySQL latin1 columns
 *  - launch route returns checkoutUrl for unpaid brands
 *  - client handles REQUIRES_SUBSCRIPTION + checkoutUrl redirect
 *  - client handles non-JSON 500 responses gracefully
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

  if (!launch.includes("checkoutUrl")) {
    fail("launch route must return checkoutUrl for unpaid brands");
  }
  pass("launch route returns checkoutUrl");

  if (!launch.includes("REQUIRES_SUBSCRIPTION")) {
    fail("launch route must return REQUIRES_SUBSCRIPTION code");
  }
  pass("launch route returns REQUIRES_SUBSCRIPTION code");

  if (!launch.includes("isVnocBrand")) {
    fail("launch route must check VNOC status");
  }
  pass("launch route checks VNOC brand status");

  if (!launch.includes("goLiveCampaign=")) {
    fail("launch route checkoutUrl must include goLiveCampaign param");
  }
  pass("launch route checkoutUrl includes goLiveCampaign");

  if (!launch.includes('{ status: 402 }') && !launch.includes("status: 402")) {
    fail("launch route must return 402 for payment-required");
  }
  pass("launch route returns 402 for payment-required");

  // --- Client checks ---
  const picker = readRepoFile("src/components/campaigns/ai-campaign-picker.tsx");

  if (!picker.includes(".json().catch(")) {
    fail("client must handle non-JSON responses gracefully");
  }
  pass("client handles non-JSON 500 responses");

  if (!picker.includes("REQUIRES_SUBSCRIPTION")) {
    fail("client must handle REQUIRES_SUBSCRIPTION code");
  }
  pass("client handles REQUIRES_SUBSCRIPTION code");

  if (!picker.includes("data.checkoutUrl")) {
    fail("client must redirect to checkoutUrl when present");
  }
  pass("client redirects to checkoutUrl");

  if (!picker.includes("res.status === 402")) {
    fail("client must handle 402 status");
  }
  pass("client handles 402 status");

  if (!picker.includes('typeof data.error === "string"')) {
    fail("client must surface specific error messages from API");
  }
  pass("client surfaces specific API error messages");

  // --- apply-campaign-suggestion export ---
  const acs = readRepoFile("src/lib/analysis/apply-campaign-suggestion.ts");
  if (!acs.includes("export function stripFancy")) {
    fail("stripFancy must be exported from apply-campaign-suggestion");
  }
  pass("stripFancy is exported");

  console.log("\nAll offline checks passed.\n");
}

main();

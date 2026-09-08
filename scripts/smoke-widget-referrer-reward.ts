/**
 * REF-R3 — widget signup rewards referrer server-side (offline wiring).
 *
 *   npx tsx scripts/smoke-widget-referrer-reward.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

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
  console.log("\n=== REF-R3 widget referrer reward smoke (offline) ===\n");

  const lib = readRepoFile("src/lib/campaign-reward.ts");
  if (!lib.includes("export async function processReward")) {
    fail("processReward must be exported from campaign-reward.ts");
  }
  if (!lib.includes("export async function tryRewardReferrerAfterSignup")) {
    fail("tryRewardReferrerAfterSignup must exist");
  }
  pass("shared campaign-reward helpers");

  const signup = readRepoFile("src/app/api/widget/signup/route.ts");
  if (!signup.includes("tryRewardReferrerAfterSignup")) {
    fail("widget signup must call tryRewardReferrerAfterSignup");
  }
  if (!signup.includes("participant.invited_by")) {
    fail("widget signup must reward only when invited_by is set");
  }
  pass("widget signup rewards referrer server-side");

  const referral = readRepoFile("src/app/api/v1/signups/referral/route.ts");
  if (!referral.includes("tryRewardReferrerAfterSignup")) {
    fail("v1 signups/referral must use shared reward helper");
  }
  if (referral.includes("async function processReward")) {
    fail("processReward must not remain private in signups/referral");
  }
  pass("v1 signups/referral uses shared processReward");

  console.log("\nAll REF-R3 offline checks passed.\n");
}

main();

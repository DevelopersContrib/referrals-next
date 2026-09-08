/**
 * REF-R4 — participant cap on every create path (offline wiring).
 *
 *   npx tsx scripts/smoke-participant-cap.ts
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

function mustInclude(file: string, needle: string, label: string) {
  if (!readRepoFile(file).includes(needle)) {
    fail(`${label}: ${file} must include ${needle}`);
  }
}

function main() {
  console.log("\n=== REF-R4 participant cap smoke (offline) ===\n");

  const subscription = readRepoFile("src/lib/member-subscription.ts");
  if (!subscription.includes("export async function assertCanAcceptParticipant")) {
    fail("assertCanAcceptParticipant must exist");
  }
  if (!subscription.includes("NOT LIKE '%@network.referrals.com'")) {
    fail("participant counts must exclude @network.referrals.com");
  }
  if (!subscription.includes("isNetworkSyntheticParticipantEmail")) {
    fail("assertCanAcceptParticipant must skip cap for network synthetics");
  }
  pass("member-subscription cap helpers");

  const paths = [
    ["src/app/api/widget/signup/route.ts", "assertCanAcceptParticipant"],
    ["src/app/api/v1/signups/route.ts", "assertCanAcceptParticipant"],
    ["src/app/api/integrations/zapier/route.ts", "assertCanAcceptParticipant"],
    [
      "src/app/api/campaigns/[campaignId]/participants/route.ts",
      "assertCanAcceptParticipant",
    ],
  ] as const;

  for (const [file, needle] of paths) {
    mustInclude(file, needle, "ingress");
  }
  pass("widget, v1 signups, Zapier, manual create all gate on cap");

  const referrer = readRepoFile("src/lib/domain-referrer.ts");
  if (!referrer.includes("export function isNetworkSyntheticParticipantEmail")) {
    fail("domain-referrer must export isNetworkSyntheticParticipantEmail");
  }
  pass("network synthetic email helper");

  console.log("\nAll REF-R4 offline checks passed.\n");
}

main();

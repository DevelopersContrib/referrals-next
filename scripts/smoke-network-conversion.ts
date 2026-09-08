/**
 * REF-R1 — network conversion POST (offline wiring).
 *
 *   npx tsx scripts/smoke-network-conversion.ts
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
  console.log("\n=== REF-R1 network conversion smoke (offline) ===\n");

  const route = readRepoFile("src/app/api/v1/network/conversions/route.ts");
  if (!route.includes("authenticateNetworkWriteKey")) {
    fail("conversions route must use network write key auth");
  }
  if (!route.includes("authenticateApiKey")) {
    pass("conversions route does not use member API keys");
  } else {
    fail("conversions route must not use authenticateApiKey");
  }
  if (!route.includes('apiError("Method not allowed", 405)')) {
    fail("GET must return 405");
  }
  if (!route.includes("resolveNetworkRef")) {
    fail("must resolve integer ref or base64 code");
  }
  pass("conversions route wiring");

  const lib = readRepoFile("src/lib/network-conversion.ts");
  if (!lib.includes("tryRewardReferrerAfterSignup")) {
    fail("must call shared reward helper");
  }
  if (lib.includes("assertCanAcceptParticipant")) {
    fail("must not cap converting visitors via owner entitlement");
  }
  pass("shared conversion + reward logic");

  const example = readRepoFile(".env.local.example");
  if (!example.includes("NETWORK_WRITE_KEY")) {
    fail(".env.local.example must document NETWORK_WRITE_KEY");
  }
  pass("env example documents NETWORK_WRITE_KEY");

  console.log("\nAll REF-R1 offline checks passed.\n");
}

main();

/**
 * REF-R2 — /t/ sets 30-day ref cookie on redirect (offline wiring).
 *
 *   npx tsx scripts/smoke-t-ref-cookie.ts
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
  console.log("\n=== REF-R2 /t/ ref cookie smoke (offline) ===\n");

  const lib = readRepoFile("src/lib/referral-attribution-cookie.ts");
  if (!lib.includes("redirectWithReferralCookie")) {
    fail("redirectWithReferralCookie must exist");
  }
  if (!lib.includes('sameSite: external ? "none" : "lax"')) {
    fail("cross-site hops must use SameSite=None");
  }
  pass("referral-attribution-cookie helper");

  for (const route of ["src/app/t/[code]/route.ts", "src/app/t2/[code]/route.ts"]) {
    const src = readRepoFile(route);
    if (!src.includes("redirectWithReferralCookie")) {
      fail(`${route} must set ref cookie on redirect`);
    }
    if (!src.includes('searchParams.set("ref"')) {
      fail(`${route} must keep ?ref= on destination`);
    }
    if (!src.includes("recordShareClick")) {
      fail(`${route} must still increment clicks`);
    }
  }
  pass("/t and /t2 set cookie + keep query param + record clicks");

  console.log("\nAll REF-R2 offline checks passed.\n");
}

main();

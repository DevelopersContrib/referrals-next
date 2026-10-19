/**
 * B16 — Win-back $1 offer smoke tests (offline, no DB).
 *
 *   npx tsx scripts/smoke-winback-b16.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

let failures = 0;

function fail(msg: string) {
  console.error(`FAIL: ${msg}`);
  failures++;
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function readRepoFile(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

function main() {
  console.log("\n=== B16 Win-back smoke tests (offline) ===\n");

  // --- 1. Billing constants ---
  const constants = readRepoFile("src/lib/billing-constants.ts");
  if (!constants.includes("WINBACK_PLAN_ID")) {
    fail("billing-constants must export WINBACK_PLAN_ID");
  } else {
    pass("WINBACK_PLAN_ID exported");
  }
  if (!constants.includes('"Brand, monthly — $1 first month"')) {
    fail("PLAN_PUBLIC_NAME must include the winback plan name");
  } else {
    pass("PLAN_PUBLIC_NAME has winback entry");
  }
  // Winback plan must NOT be in PUBLIC_SALE_PLAN_IDS
  if (constants.includes("PUBLIC_SALE_PLAN_IDS") && /PUBLIC_SALE_PLAN_IDS.*7/.test(constants)) {
    fail("WINBACK_PLAN_ID must NOT be in PUBLIC_SALE_PLAN_IDS (hidden from /pricing)");
  } else {
    pass("winback plan not in PUBLIC_SALE_PLAN_IDS");
  }

  // --- 2. Offer eligibility ---
  const winback = readRepoFile("src/lib/billing-winback.ts");
  if (!winback.includes("export async function memberHasUsedWinbackOffer")) {
    fail("billing-winback must export memberHasUsedWinbackOffer");
  } else {
    pass("memberHasUsedWinbackOffer exists");
  }
  if (!winback.includes("WINBACK_PLAN_ID")) {
    fail("billing-winback must reference WINBACK_PLAN_ID for eligibility check");
  } else {
    pass("eligibility check uses WINBACK_PLAN_ID");
  }
  if (!winback.includes("export function winbackCheckoutUrl")) {
    fail("billing-winback must export winbackCheckoutUrl");
  } else {
    pass("winbackCheckoutUrl exported");
  }

  // --- 3. URL and UTM building ---
  if (!winback.includes("utm_source=winback")) {
    fail("winbackCheckoutUrl must include utm_source=winback");
  } else {
    pass("UTM source present");
  }
  if (!winback.includes("utm_campaign=oct2026")) {
    fail("winbackCheckoutUrl must include utm_campaign=oct2026");
  } else {
    pass("UTM campaign present");
  }
  if (!winback.includes(`/billing/plan/`)) {
    fail("winbackCheckoutUrl must use /billing/plan/ path");
  } else {
    pass("checkout URL uses /billing/plan/ route");
  }
  if (!winback.includes("brandId=")) {
    fail("winbackCheckoutUrl must include brandId param");
  } else {
    pass("checkout URL includes brandId");
  }

  // --- 4. PayPal trial plan ---
  if (!winback.includes("TRIAL")) {
    fail("billing-winback must create a PayPal plan with TRIAL tenure_type");
  } else {
    pass("PayPal plan uses TRIAL tenure");
  }
  if (!winback.includes("1.00")) {
    fail("Trial price must be $1.00");
  } else {
    pass("Trial price is $1.00");
  }
  if (!winback.includes("9.00")) {
    fail("Regular price must be $9.00");
  } else {
    pass("Regular price is $9.00");
  }
  if (!winback.includes("sequence: 1") || !winback.includes("sequence: 2")) {
    fail("PayPal plan must have two billing cycles (sequence 1 and 2)");
  } else {
    pass("Two billing cycles (trial + regular)");
  }

  // --- 5. Checkout page eligibility gate ---
  const checkoutPage = readRepoFile("src/app/(dashboard)/billing/plan/[planId]/page.tsx");
  if (!checkoutPage.includes("memberHasUsedWinbackOffer")) {
    fail("Plan checkout page must check memberHasUsedWinbackOffer");
  } else {
    pass("Checkout page enforces one-use per member");
  }
  if (!checkoutPage.includes("WINBACK_PLAN_ID")) {
    fail("Plan checkout page must reference WINBACK_PLAN_ID");
  } else {
    pass("Checkout page references WINBACK_PLAN_ID");
  }

  // --- 6. Email template ---
  const template = readRepoFile("src/lib/winback-email-template.ts");
  if (!template.includes("Maida B.")) {
    fail("Email template must be signed by Maida B.");
  } else {
    pass("Email signed by Maida B.");
  }
  if (!template.includes("$1 for your first month")) {
    fail("Email must mention the $1 first month offer");
  } else {
    pass("Email mentions $1 first month");
  }
  if (!template.includes("$9/mo")) {
    fail("Email must mention the regular $9/mo price");
  } else {
    pass("Email mentions $9/mo renewal");
  }
  if (!template.includes("Cancel anytime")) {
    fail("Email must mention cancel anytime");
  } else {
    pass("Email mentions cancel anytime");
  }

  // --- 7. Email sender script ---
  const sender = readRepoFile("scripts/winback-send-emails.ts");
  if (!sender.includes("DRY")) {
    fail("Email sender must be dry-run by default");
  } else {
    pass("Sender defaults to dry-run");
  }
  if (!sender.includes("--send")) {
    fail("Sender must require --send flag");
  } else {
    pass("Sender requires --send flag");
  }
  if (!sender.includes("WINBACK_SEND")) {
    fail("Sender must require WINBACK_SEND env var");
  } else {
    pass("Sender requires WINBACK_SEND env var");
  }
  if (!sender.includes("BATCH_SIZE") || !sender.includes("200")) {
    fail("Sender must send in batches of 200");
  } else {
    pass("Sender uses batch size of 200");
  }
  if (!sender.includes("utm_source=winback")) {
    fail("Sender must include UTM params in checkout URLs");
  } else {
    pass("Sender includes UTM params");
  }
  if (!sender.includes("winback_email_log")) {
    fail("Sender must log to winback_email_log");
  } else {
    pass("Sender logs to winback_email_log");
  }

  // --- 8. SQL migration ---
  const sql = readRepoFile("prisma/sql/winback_plan_and_log.sql");
  if (!sql.includes("INSERT INTO plans")) {
    fail("SQL must insert the winback plan row");
  } else {
    pass("SQL inserts winback plan");
  }
  if (sql.includes("is_for_sale")) {
    fail("SQL must NOT reference is_for_sale (column removed; use code-level WINBACK_PLAN_ID rule)");
  } else {
    pass("SQL does not reference is_for_sale");
  }
  if (!sql.includes("winback_email_log")) {
    fail("SQL must create winback_email_log table");
  } else {
    pass("SQL creates winback_email_log table");
  }

  // --- 9. Prisma schema ---
  const schema = readRepoFile("prisma/schema.prisma");
  if (!schema.includes("winback_email_log")) {
    fail("Prisma schema must include winback_email_log model");
  } else {
    pass("Prisma schema has winback_email_log model");
  }
  if (schema.includes("is_for_sale")) {
    fail("Prisma schema plans model must NOT include is_for_sale (column removed)");
  } else {
    pass("Prisma schema plans model does not have is_for_sale (code-level rule)");
  }

  // --- 10. Query script ---
  const query = readRepoFile("scripts/winback-unpaid-brands.ts");
  if (!query.includes("in_vnoc")) {
    fail("Query script must filter by in_vnoc");
  } else {
    pass("Query filters VNOC brands");
  }
  if (!query.includes("vnoc_id")) {
    fail("Query script must filter by vnoc_id");
  } else {
    pass("Query filters vnoc_id brands");
  }
  if (!query.includes("name,email,brand_domain,brand_id,signup_date,last_login")) {
    fail("Query CSV must have required columns");
  } else {
    pass("Query CSV has required columns");
  }

  console.log(`\n${failures === 0 ? "All" : "Some"} B16 checks ${failures === 0 ? "passed" : "failed"}.`);
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.\n`);
    process.exit(1);
  }
  console.log("");
}

main();

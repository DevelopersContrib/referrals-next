/**
 * REF-R7 — per-brand pay stamp + getBrandEntitlement (offline wiring).
 *
 *   npx tsx scripts/smoke-brand-entitlement.ts
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
  console.log("\n=== REF-R7 brand entitlement smoke (offline) ===\n");

  const subscription = readRepoFile("src/lib/member-subscription.ts");
  if (!subscription.includes("export async function getBrandEntitlement")) {
    fail("getBrandEntitlement must exist");
  }
  if (!subscription.includes("isVnoc")) {
    fail("getBrandEntitlement must expose VNOC handling");
  }
  if (!subscription.includes("export function brandShouldShowUpgradeCta")) {
    fail("brandShouldShowUpgradeCta must exist for REF-J5 brand CTAs");
  }
  if (!subscription.includes("export async function brandMustShowBranding")) {
    fail("brandMustShowBranding must exist");
  }
  if (
    !subscription.includes("export async function canBrandAcceptParticipant")
  ) {
    fail("canBrandAcceptParticipant must exist");
  }
  if (!subscription.includes('e.status === "trial"')) {
    fail("canMemberAddBrand must only bypass domain cap for account trial");
  }
  pass("member-subscription exports per-brand entitlement helpers");

  const activation = readRepoFile("src/lib/billing-activation.ts");
  if (!activation.includes("member_urls.update")) {
    fail("activatePaidSubscription must stamp member_urls.plan_expiry");
  }
  if (!activation.includes("if (!brandId)")) {
    fail(
      "activatePaidSubscription must skip members.plan_* when brandId is set",
    );
  }
  if (!activation.includes("activatePaidSubscriptionFromWebhook")) {
    fail("activatePaidSubscriptionFromWebhook must exist");
  }
  if (!activation.includes("extendPaidSubscriptionPeriod")) {
    fail("extendPaidSubscriptionPeriod must exist");
  }
  pass("billing-activation stamps brand + webhook helpers");

  const webhook = readRepoFile("src/app/api/billing/webhook/route.ts");
  if (!webhook.includes("activatePaidSubscriptionFromWebhook")) {
    fail("webhook must call activatePaidSubscriptionFromWebhook");
  }
  if (!webhook.includes("extendPaidSubscriptionPeriod")) {
    fail("webhook renewals must extend per-brand expiry");
  }
  if (webhook.includes("handlePaidEngagementTransition")) {
    fail("webhook must not enroll engagement directly");
  }
  pass("webhook activates via checkout attempt + extends brand expiry");

  const widget = readRepoFile("src/app/widget/[campaignId]/widget-data.ts");
  if (!widget.includes("brandMustShowBranding(campaign.url_id)")) {
    fail("widget branding must be per-brand");
  }
  pass("widget uses brandMustShowBranding");

  console.log("\nAll REF-R7 offline checks passed.\n");
}

main();

/**
 * REF-R7 + Sept 14–18 R1–R4 — per-brand pay + unpaid external + VNOC guard.
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
  console.log("\n=== Brand entitlement smoke (offline) ===\n");

  const subscription = readRepoFile("src/lib/member-subscription.ts");
  if (!subscription.includes("export async function getBrandEntitlement")) {
    fail("getBrandEntitlement must exist");
  }
  if (!subscription.includes("isVnoc")) {
    fail("getBrandEntitlement must expose VNOC handling");
  }
  if (!subscription.includes("export function isVnocBrand")) {
    fail("isVnocBrand must check in_vnoc and vnoc_id");
  }
  if (!subscription.includes('status: "unpaid"')) {
    fail("post-trial external brands must use unpaid status");
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
  if (!subscription.includes("export async function getPrimaryCheckoutBrand")) {
    fail("getPrimaryCheckoutBrand must exist for trial/unpaid CTAs");
  }
  pass("member-subscription exports per-brand entitlement helpers");

  const activation = readRepoFile("src/lib/billing-activation.ts");
  if (!activation.includes("member_urls.update")) {
    fail("activatePaidSubscription must stamp member_urls.plan_expiry");
  }
  if (!activation.includes("if (!stampBrandId)")) {
    fail(
      "activatePaidSubscription must skip members.plan_* when brand stamp applies",
    );
  }
  if (!activation.includes("isVnocBrand")) {
    fail("activatePaidSubscription must refuse VNOC brand stamps");
  }
  if (!activation.includes('"brand_missing"')) {
    fail("activatePaidSubscription must log brand_missing when brandId absent");
  }
  if (!activation.includes("activatePaidSubscriptionFromWebhook")) {
    fail("activatePaidSubscriptionFromWebhook must exist");
  }
  if (!activation.includes("extendPaidSubscriptionPeriod")) {
    fail("extendPaidSubscriptionPeriod must exist");
  }
  pass("billing-activation stamps brand + webhook helpers");

  const catalog = readRepoFile("src/lib/plan-catalog.ts");
  if (!catalog.includes("export function splitPlanAudiences")) {
    fail("plan-catalog must export splitPlanAudiences");
  }
  if (!catalog.includes("export function getPlanFeatures")) {
    fail("plan-catalog must export getPlanFeatures");
  }
  pass("plan-catalog helper exists");

  const billingPage = readRepoFile("src/app/(dashboard)/billing/page.tsx");
  if (!billingPage.includes('from "@/lib/plan-catalog"')) {
    fail("billing page must import plan-catalog");
  }
  pass("billing page imports plan-catalog");

  const cron = readRepoFile("src/app/api/cron/plan-expiry/route.ts");
  if (cron.includes("free forever")) {
    fail("plan-expiry cron must not promise free forever");
  }
  if (!cron.includes("brandId=")) {
    fail("plan-expiry trial emails must link with brandId when known");
  }
  pass("plan-expiry cron copy + brand checkout link");

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

  console.log("\nAll offline checks passed.\n");
}

main();

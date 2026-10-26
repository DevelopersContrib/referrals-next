/**
 * B2 — Attach an orphan payment to a brand.
 *
 * Dry-run by default. Pass --apply to actually write the change.
 * This script must NOT be run against production without Maida's decision on
 * each payment (refund vs attach).
 *
 * In addition to setting member_payment.url_id, --apply mode now also:
 * - Creates a url_plan row (agreement id, payment_id) if one doesn't exist
 * - Sets/extends member_urls.plan_expiry
 * Idempotent: running twice with the same args produces the same end state.
 *
 * Usage:
 *   npx tsx scripts/attach-orphan-payment.ts <paymentId> <brandId>             # dry-run
 *   npx tsx scripts/attach-orphan-payment.ts <paymentId> <brandId> --apply     # write
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PLAN_DAYS = 30;

async function main() {
  const args = process.argv.slice(2);
  const paymentId = parseInt(args[0], 10);
  const brandId = parseInt(args[1], 10);
  const apply = args.includes("--apply");

  if (!Number.isFinite(paymentId) || !Number.isFinite(brandId)) {
    console.error("Usage: attach-orphan-payment.ts <paymentId> <brandId> [--apply]");
    process.exit(1);
  }

  const payment = await prisma.member_payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      member_id: true,
      url_id: true,
      amount: true,
      transaction_id: true,
      datetime_created: true,
      plan_expiry: true,
    },
  });

  if (!payment) {
    console.error(`Payment #${paymentId} not found.`);
    process.exit(1);
  }

  if (payment.url_id && payment.url_id !== brandId) {
    console.error(
      `Payment #${paymentId} is already attached to brand #${payment.url_id}. Nothing to do.`,
    );
    return;
  }

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { id: true, member_id: true, domain: true, plan_expiry: true },
  });

  if (!brand) {
    console.error(`Brand #${brandId} not found.`);
    process.exit(1);
  }

  if (brand.member_id !== payment.member_id) {
    console.error(
      `Brand #${brandId} belongs to member #${brand.member_id}, but payment #${paymentId} belongs to member #${payment.member_id}. Aborting.`,
    );
    process.exit(1);
  }

  // Look up member_plan to get the PayPal plan/agreement ids and internal plan id.
  const memberPlan = payment.transaction_id
    ? await prisma.member_plan.findFirst({
        where: {
          member_id: payment.member_id,
          paypal_agreement_id: payment.transaction_id,
        },
        orderBy: { id: "desc" },
        select: {
          paypal_plan_id: true,
          paypal_agreement_id: true,
          payment_id: true,
        },
      })
    : null;

  const planId = memberPlan?.payment_id ?? 2; // default to Brand monthly
  const plan = await prisma.plans.findUnique({
    where: { id: planId },
    select: { id: true, days: true, price: true },
  });
  const planDays = plan?.days || DEFAULT_PLAN_DAYS;

  // Check if url_plan already exists for this brand+agreement
  const existingUrlPlan = await prisma.url_plan.findFirst({
    where: {
      url_id: brandId,
      member_id: payment.member_id,
      ...(memberPlan?.paypal_agreement_id
        ? { paypal_agreement_id: memberPlan.paypal_agreement_id }
        : {}),
    },
    select: { id: true },
  });

  // Compute expiry: extend from current expiry or payment date
  const now = new Date();
  const base =
    brand.plan_expiry && brand.plan_expiry > now
      ? brand.plan_expiry
      : payment.datetime_created;
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + planDays);

  console.log(`Payment #${paymentId}:`);
  console.log(`  Member: #${payment.member_id}`);
  console.log(`  Amount: $${payment.amount}`);
  console.log(`  Date:   ${payment.datetime_created.toISOString().slice(0, 10)}`);
  console.log(`  Txn:    ${payment.transaction_id ?? "(none)"}`);
  console.log(`  → Attach to brand #${brandId} (${brand.domain})`);
  console.log(`  Plan id: ${planId} (days: ${planDays})`);
  console.log(`  New plan_expiry: ${newExpiry.toISOString().slice(0, 10)}`);
  if (payment.url_id === brandId) {
    console.log(`  member_payment.url_id already set to ${brandId}`);
  }
  if (existingUrlPlan) {
    console.log(`  url_plan row already exists — will skip creation`);
  }

  if (!apply) {
    console.log("\nDRY RUN — no changes made. Pass --apply to write.");
    return;
  }

  // 1. Set member_payment.url_id (skip if already correct)
  if (payment.url_id !== brandId) {
    await prisma.member_payment.update({
      where: { id: paymentId },
      data: { url_id: brandId },
    });
    console.log("\n✓ member_payment.url_id updated.");
  }

  // 2. Create url_plan row if it doesn't already exist
  if (!existingUrlPlan) {
    await prisma.url_plan.create({
      data: {
        url_id: brandId,
        member_id: payment.member_id,
        paypal_plan_id: memberPlan?.paypal_plan_id ?? "",
        paypal_agreement_id: memberPlan?.paypal_agreement_id ?? payment.transaction_id ?? "",
        payment_id: planId,
        date_added: payment.datetime_created,
      },
    });
    console.log("✓ url_plan row created.");
  } else {
    console.log("✓ url_plan row already exists — skipped.");
  }

  // 3. Set/extend member_urls.plan_expiry (never shorten)
  const shouldUpdate =
    !brand.plan_expiry || newExpiry > brand.plan_expiry;
  if (shouldUpdate) {
    await prisma.member_urls.update({
      where: { id: brandId },
      data: { plan_expiry: newExpiry },
    });
    console.log(`✓ member_urls.plan_expiry set to ${newExpiry.toISOString().slice(0, 10)}.`);
  } else {
    console.log(`✓ member_urls.plan_expiry already ${brand.plan_expiry!.toISOString().slice(0, 10)} (>= new) — skipped.`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

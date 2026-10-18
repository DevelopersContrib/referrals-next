/**
 * B2 — Attach an orphan payment to a brand.
 *
 * Dry-run by default. Pass --apply to actually write the change.
 * This script must NOT be run against production without Maida's decision on
 * each payment (refund vs attach).
 *
 * Usage:
 *   npx tsx scripts/attach-orphan-payment.ts <paymentId> <brandId>             # dry-run
 *   npx tsx scripts/attach-orphan-payment.ts <paymentId> <brandId> --apply     # write
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    },
  });

  if (!payment) {
    console.error(`Payment #${paymentId} not found.`);
    process.exit(1);
  }

  if (payment.url_id) {
    console.error(
      `Payment #${paymentId} is already attached to brand #${payment.url_id}. Nothing to do.`,
    );
    return;
  }

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { id: true, member_id: true, domain: true },
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

  console.log(`Payment #${paymentId}:`);
  console.log(`  Member: #${payment.member_id}`);
  console.log(`  Amount: $${payment.amount}`);
  console.log(`  Date:   ${payment.datetime_created.toISOString().slice(0, 10)}`);
  console.log(`  Txn:    ${payment.transaction_id ?? "(none)"}`);
  console.log(`  → Attach to brand #${brandId} (${brand.domain})`);

  if (!apply) {
    console.log("\nDRY RUN — no changes made. Pass --apply to write.");
    return;
  }

  await prisma.member_payment.update({
    where: { id: paymentId },
    data: { url_id: brandId },
  });

  console.log("\nDone: member_payment.url_id updated.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

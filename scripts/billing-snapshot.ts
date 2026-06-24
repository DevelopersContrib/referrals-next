/**
 * Snapshot a member's billing-related rows so you can diff before/after a
 * PayPal webhook event (K5 verification).
 *
 * Usage:
 *   npx tsx scripts/billing-snapshot.ts <memberId | email | agreementId>
 *
 * The argument is auto-detected:
 *   - numeric            -> members.id
 *   - contains "@"       -> members.email
 *   - anything else      -> member_plan.paypal_agreement_id (e.g. I-XXXX...)
 *
 * Output is pretty-printed JSON (readable AND diffable). Capture it around a
 * real webhook delivery and compare:
 *
 *   npx tsx scripts/billing-snapshot.ts I-ABC123 > before.json
 *   # ...fire the PayPal sandbox event, confirm 200 in ngrok / dashboard...
 *   npx tsx scripts/billing-snapshot.ts I-ABC123 > after.json
 *   diff before.json after.json
 *
 * Expected diffs by event type:
 *   BILLING.SUBSCRIPTION.ACTIVATED -> memberPlans[].agreement_activate set
 *   BILLING.SUBSCRIPTION.CANCELLED -> memberPlans[].agreement_cancel set
 *   PAYMENT.SALE.COMPLETED         -> new recentPayments[] row + member.plan_expiry +30d
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resolveMemberId(arg: string): Promise<number> {
  // numeric -> member id
  if (/^\d+$/.test(arg)) {
    const id = parseInt(arg, 10);
    const member = await prisma.members.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!member) throw new Error(`No member found with id ${id}`);
    return id;
  }

  // email
  if (arg.includes("@")) {
    const member = await prisma.members.findFirst({
      where: { email: arg },
      select: { id: true },
    });
    if (!member) throw new Error(`No member found for email: ${arg}`);
    return member.id;
  }

  // otherwise treat as a PayPal agreement id
  const plan = await prisma.member_plan.findFirst({
    where: { paypal_agreement_id: arg },
    orderBy: { id: "desc" },
    select: { member_id: true },
  });
  if (!plan) {
    throw new Error(`No member_plan found with paypal_agreement_id: ${arg}`);
  }
  return plan.member_id;
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    throw new Error(
      "Pass a member id, email, or PayPal agreement id.\n" +
        "  npx tsx scripts/billing-snapshot.ts <memberId | email | agreementId>"
    );
  }

  const memberId = await resolveMemberId(arg);

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, email: true, plan_id: true, plan_expiry: true },
  });

  const memberPlans = await prisma.member_plan.findMany({
    where: { member_id: memberId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      paypal_plan_id: true,
      paypal_agreement_id: true,
      agreement_activate: true,
      agreement_cancel: true,
      date_added: true,
    },
  });

  const recentPayments = await prisma.member_payment.findMany({
    where: { member_id: memberId },
    orderBy: { id: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      transaction_id: true,
      datetime_created: true,
    },
  });

  const snapshot = {
    // Stamped from the OS so before/after files differ even if data is identical.
    snapshotAt: new Date().toISOString(),
    member,
    memberPlans,
    recentPayments,
  };

  console.log(JSON.stringify(snapshot, null, 2));
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Start 14-day Growth reverse trial for all non-paid members.
 *
 *   npx tsx scripts/start-reverse-trial-cutover.ts
 *   npx tsx scripts/start-reverse-trial-cutover.ts --confirm
 */
import { prisma } from "../src/lib/prisma";
import { TRIAL_DAYS, TRIAL_PLAN_ID, trialExpiryFrom } from "../src/lib/member-subscription";

async function main() {
  const confirm = process.argv.includes("--confirm");
  const expiry = trialExpiryFrom();

  const paidIds = await prisma.$queryRawUnsafe<{ id: number }[]>(`
    SELECT m.id
    FROM members m
    JOIN plans p ON p.id = m.plan_id
    WHERE m.plan_id > 0
      AND m.plan_expiry IS NOT NULL
      AND m.plan_expiry > NOW()
      AND p.price > 0
  `);
  const paidSet = new Set(paidIds.map((r) => r.id));

  const candidates = await prisma.members.findMany({
    where: paidSet.size > 0 ? { id: { notIn: [...paidSet] } } : undefined,
    select: { id: true, email: true, plan_id: true, plan_expiry: true },
  });

  console.log(`\nReverse trial cutover (${TRIAL_DAYS}d)`);
  console.log(`Paid (skip): ${paidSet.size}`);
  console.log(`Will set plan_id=${TRIAL_PLAN_ID}, plan_expiry=${expiry.toISOString()}: ${candidates.length}`);
  console.log(confirm ? "WRITING…" : "(dry-run — pass --confirm to write)\n");

  if (!confirm) return;

  const batch = 200;
  let updated = 0;
  for (let i = 0; i < candidates.length; i += batch) {
    const ids = candidates.slice(i, i + batch).map((c) => c.id);
    const r = await prisma.members.updateMany({
      where: { id: { in: ids } },
      data: { plan_id: TRIAL_PLAN_ID, plan_expiry: expiry },
    });
    updated += r.count;
    console.log(`  updated ${updated}/${candidates.length}`);
  }
  console.log(`\nDone. Updated ${updated} members.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

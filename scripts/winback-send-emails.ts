/**
 * B16 — Win-back email sender.
 *
 * DRY-RUN by default. Requires BOTH flags to actually send:
 *   --send               CLI flag
 *   WINBACK_SEND=true    env var
 *
 * Usage:
 *   npx tsx scripts/winback-send-emails.ts                    # dry run
 *   WINBACK_SEND=true npx tsx scripts/winback-send-emails.ts --send  # live
 *
 * Sends in batches of 200. Logs every send to winback_email_log table.
 * Do NOT run until Maida approves the copy.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { winbackEmailHtml, winbackEmailSubject } from "../src/lib/winback-email-template";

const WINBACK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.referrals.com";

function winbackCheckoutUrl(brandId: number): string {
  return `${WINBACK_BASE_URL}/billing/plan/${WINBACK_PLAN_ID}?brandId=${brandId}&utm_source=winback&utm_campaign=oct2026`;
}

const WINBACK_PLAN_ID = 7;
const BATCH_SIZE = 200;

const prisma = new PrismaClient();

function isDryRun(): boolean {
  const cliSend = process.argv.includes("--send");
  const envSend = process.env.WINBACK_SEND === "true";
  return !(cliSend && envSend);
}

interface WinbackTarget {
  memberId: number;
  memberName: string;
  memberEmail: string;
  brandId: number;
  brandDomain: string;
}

async function findTargets(): Promise<WinbackTarget[]> {
  const targets: WinbackTarget[] = [];

  const members = await prisma.members.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  for (const member of members) {
    const brands = await prisma.member_urls.findMany({
      where: { member_id: member.id },
      select: {
        id: true,
        domain: true,
        in_vnoc: true,
        vnoc_id: true,
        plan_expiry: true,
      },
    });

    for (const brand of brands) {
      if (brand.in_vnoc || brand.vnoc_id != null) continue;

      const hasActivePlan =
        brand.plan_expiry != null &&
        new Date(brand.plan_expiry).getTime() > Date.now();
      if (hasActivePlan) continue;

      // Check if already used the winback offer
      const alreadyUsed = await prisma.member_plan.findFirst({
        where: { member_id: member.id, payment_id: WINBACK_PLAN_ID },
        select: { id: true },
      });
      if (alreadyUsed) continue;

      // Check if already sent a winback email for this brand
      const alreadySent = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
        `SELECT COUNT(*) as c FROM winback_email_log WHERE member_id = ? AND brand_id = ?`,
        member.id,
        brand.id,
      ).catch(() => [{ c: BigInt(0) }]);
      if (Number(alreadySent[0]?.c ?? 0) > 0) continue;

      targets.push({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        brandId: brand.id,
        brandDomain: brand.domain,
      });
    }
  }

  return targets;
}

function createSesClient(): SESClient {
  return new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

async function sendOne(
  ses: SESClient,
  target: WinbackTarget,
  fromEmail: string,
): Promise<void> {
  const checkoutUrl = winbackCheckoutUrl(target.brandId);
  const firstName = target.memberName.split(/\s+/)[0] || target.memberName;
  const subject = winbackEmailSubject(target.brandDomain);
  const html = winbackEmailHtml({
    firstName,
    brandDomain: target.brandDomain,
    checkoutUrl,
  });

  const command = new SendEmailCommand({
    Source: `Maida B. <${fromEmail}>`,
    Destination: { ToAddresses: [target.memberEmail] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: { Html: { Data: html, Charset: "UTF-8" } },
    },
  });

  await ses.send(command);
}

async function logSend(
  target: WinbackTarget,
  batchNumber: number,
  status: "sent" | "failed" | "dry_run",
  errorMessage?: string,
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO winback_email_log (member_id, brand_id, email, batch_number, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      target.memberId,
      target.brandId,
      target.memberEmail,
      batchNumber,
      status,
      errorMessage ?? null,
    );
  } catch (e) {
    console.error(`  [log] Failed to log send for ${target.memberEmail}:`, e);
  }
}

async function main() {
  const dryRun = isDryRun();

  if (dryRun) {
    console.log("=== DRY RUN (no emails will be sent) ===");
    console.log("To send for real: WINBACK_SEND=true npx tsx scripts/winback-send-emails.ts --send\n");
  } else {
    console.log("=== LIVE MODE — emails WILL be sent ===\n");
  }

  const targets = await findTargets();
  console.log(`Found ${targets.length} targets\n`);

  if (targets.length === 0) {
    console.log("No targets found. Exiting.");
    return;
  }

  const fromEmail =
    process.env.SUPPORT_FROM_EMAIL?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    process.env.AWS_SES_FROM_EMAIL?.trim() ||
    "support@referrals.com";

  const ses = dryRun ? null : createSesClient();
  let sent = 0;
  let failed = 0;
  let batchNumber = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    batchNumber++;
    const batch = targets.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${batchNumber}: ${batch.length} emails (offset ${i})`);

    for (const target of batch) {
      const checkoutUrl = winbackCheckoutUrl(target.brandId);

      if (dryRun) {
        console.log(`  [dry-run] ${target.memberEmail} | ${target.brandDomain} | ${checkoutUrl}`);
        sent++;
        continue;
      }

      try {
        await sendOne(ses!, target, fromEmail);
        await logSend(target, batchNumber, "sent");
        console.log(`  [sent] ${target.memberEmail} | ${target.brandDomain}`);
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await logSend(target, batchNumber, "failed", msg);
        console.error(`  [failed] ${target.memberEmail}: ${msg}`);
        failed++;
      }
    }

    if (!dryRun && i + BATCH_SIZE < targets.length) {
      console.log("  Pausing 2s between batches...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}, Total: ${targets.length}`);
  if (dryRun) {
    console.log("(dry run — nothing was actually sent)");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

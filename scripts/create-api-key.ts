/**
 * Create a Referrals.com REST API key for a member.
 *
 * Usage:
 *   npx tsx scripts/create-api-key.ts
 *   npx tsx scripts/create-api-key.ts user@example.com
 *
 * Without an email, uses the first entry in ADMIN_EMAILS, then ADMIN_MEMBER_IDS.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function newApiKey() {
  return `ref_${randomBytes(24).toString("hex")}`;
}

async function resolveMemberId(emailArg?: string): Promise<number> {
  if (emailArg) {
    const member = await prisma.members.findFirst({
      where: { email: emailArg },
      select: { id: true, email: true },
    });
    if (!member) throw new Error(`No member found for email: ${emailArg}`);
    console.log(`Member: ${member.email} (id ${member.id})`);
    return member.id;
  }

  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (adminEmail) {
    const member = await prisma.members.findFirst({
      where: { email: adminEmail },
      select: { id: true, email: true },
    });
    if (member) {
      console.log(`Member: ${member.email} (id ${member.id})`);
      return member.id;
    }
  }

  const adminId = parseInt(
    process.env.ADMIN_MEMBER_IDS?.split(",")[0]?.trim() || "",
    10
  );
  if (!Number.isNaN(adminId)) {
    const member = await prisma.members.findUnique({
      where: { id: adminId },
      select: { id: true, email: true },
    });
    if (member) {
      console.log(`Member: ${member.email} (id ${member.id})`);
      return member.id;
    }
  }

  throw new Error(
    "Pass an email argument or set ADMIN_EMAILS / ADMIN_MEMBER_IDS in .env"
  );
}

async function main() {
  const emailArg = process.argv[2];
  const memberId = await resolveMemberId(emailArg);
  const apiKey = newApiKey();

  const row = await prisma.member_keys.create({
    data: {
      api_key: apiKey,
      userid: memberId,
      date_generated: new Date(),
    },
  });

  console.log("\nAPI key created (copy now — store it securely):\n");
  console.log(row.api_key);
  console.log(`\nGenerated: ${row.date_generated.toISOString()}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

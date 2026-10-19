/**
 * B16 — Win-back: list members with at least one unpaid, non-VNOC brand.
 *
 * READ-ONLY. Outputs CSV to stdout.
 * Do NOT run against production — Lee will.
 *
 * Usage:
 *   npx tsx scripts/winback-unpaid-brands.ts
 *   npx tsx scripts/winback-unpaid-brands.ts > winback-list.csv
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface WinbackRow {
  memberName: string;
  memberEmail: string;
  brandDomain: string;
  brandId: number;
  signupDate: string;
  lastLogin: string;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function main() {
  const rows: WinbackRow[] = [];

  const members = await prisma.members.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      date_signedup: true,
      num_of_logins: true,
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

      const urlPlan = await prisma.url_plan.findFirst({
        where: { url_id: brand.id, member_id: member.id },
        select: { id: true },
      });
      if (urlPlan) {
        const payment = await prisma.member_payment.findFirst({
          where: { member_id: member.id, url_id: brand.id, status: "completed" },
          select: { id: true },
        });
        if (payment) continue;
      }

      rows.push({
        memberName: member.name,
        memberEmail: member.email,
        brandDomain: brand.domain,
        brandId: brand.id,
        signupDate: member.date_signedup.toISOString().slice(0, 10),
        lastLogin: member.num_of_logins
          ? `${member.num_of_logins} logins`
          : "never",
      });
    }
  }

  console.log("name,email,brand_domain,brand_id,signup_date,last_login");
  for (const r of rows) {
    console.log(
      [
        csvEscape(r.memberName),
        csvEscape(r.memberEmail),
        csvEscape(r.brandDomain),
        String(r.brandId),
        r.signupDate,
        r.lastLogin,
      ].join(","),
    );
  }

  console.error(`\nTotal: ${rows.length} unpaid non-VNOC brands`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

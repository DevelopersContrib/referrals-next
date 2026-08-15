/**
 * Lightweight paid-conversion snapshot (sequential counts — avoids one giant scan).
 *   npx tsx scripts/paid-funnel-snapshot.ts
 */
import { prisma } from "../src/lib/prisma";

function n(v: unknown) {
  return Number(v ?? 0);
}

async function count(sql: string, ...params: unknown[]) {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(sql, ...params);
  return n(rows[0]?.c);
}

async function main() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d90 = new Date(now.getTime() - 90 * 864e5);
  const d365 = new Date(now.getTime() - 365 * 864e5);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const free =
    "(plan_id IS NULL OR plan_id <= 1 OR plan_expiry IS NULL OR plan_expiry < NOW())";
  const paid =
    "(plan_id > 1 AND (plan_expiry IS NULL OR plan_expiry > NOW()))";
  const freeM =
    "(m.plan_id IS NULL OR m.plan_id <= 1 OR m.plan_expiry IS NULL OR m.plan_expiry < NOW())";
  const paidM =
    "(m.plan_id > 1 AND (m.plan_expiry IS NULL OR m.plan_expiry > NOW()))";

  console.error("counting members…");
  const total = await count(`SELECT COUNT(*) AS c FROM members`);
  const freeN = await count(`SELECT COUNT(*) AS c FROM members WHERE ${free}`);
  const paidN = await count(`SELECT COUNT(*) AS c FROM members WHERE ${paid}`);

  console.error("activation…");
  const freeWithUrl = await count(`
    SELECT COUNT(DISTINCT m.id) AS c FROM members m
    JOIN member_urls u ON u.member_id = m.id
    WHERE ${freeM}`);
  const freeWithCamp = await count(`
    SELECT COUNT(DISTINCT m.id) AS c FROM members m
    JOIN member_campaigns mc ON mc.member_id = m.id
    WHERE ${freeM}`);
  const paidWithCamp = await count(`
    SELECT COUNT(DISTINCT m.id) AS c FROM members m
    JOIN member_campaigns mc ON mc.member_id = m.id
    WHERE ${paidM}`);
  const freeMultiUrl = await count(`
    SELECT COUNT(*) AS c FROM (
      SELECT m.id FROM members m
      JOIN member_urls u ON u.member_id = m.id
      WHERE ${freeM}
      GROUP BY m.id HAVING COUNT(u.id) >= 2
    ) x`);
  const paidMultiUrl = await count(`
    SELECT COUNT(*) AS c FROM (
      SELECT m.id FROM members m
      JOIN member_urls u ON u.member_id = m.id
      WHERE ${paidM}
      GROUP BY m.id HAVING COUNT(u.id) >= 2
    ) x`);

  console.error("cohorts…");
  const quietFree90 = await count(
    `
    SELECT COUNT(*) AS c FROM members m
    WHERE ${freeM} AND m.date_signedup < ?
      AND NOT EXISTS (SELECT 1 FROM member_campaigns mc WHERE mc.member_id = m.id LIMIT 1)
  `,
    d90
  );
  const new30 = await count(`SELECT COUNT(*) AS c FROM members WHERE date_signedup >= ?`, d30);
  const new30Camp = await count(
    `
    SELECT COUNT(DISTINCT m.id) AS c FROM members m
    JOIN member_campaigns mc ON mc.member_id = m.id
    WHERE m.date_signedup >= ?
  `,
    d30
  );
  const new30Paid = await count(
    `SELECT COUNT(*) AS c FROM members m WHERE ${paidM} AND m.date_signedup >= ?`,
    d30
  );

  console.error("subscriptions / mrr…");
  const [active, cancelled, pending, totalMp, newThisMonth] = await Promise.all([
    prisma.member_plan.count({
      where: { agreement_activate: { not: null }, agreement_cancel: null },
    }),
    prisma.member_plan.count({ where: { agreement_cancel: { not: null } } }),
    prisma.member_plan.count({
      where: { agreement_activate: null, agreement_cancel: null },
    }),
    prisma.member_plan.count(),
    prisma.member_plan.count({ where: { date_added: { gte: monthStart } } }),
  ]);
  const mrrRows = await prisma.$queryRawUnsafe<{ mrr: number | null }[]>(`
    SELECT COALESCE(
      SUM(CASE WHEN pl.unit = 'year' THEN pl.price / 12 ELSE pl.price END),
    0) AS mrr
    FROM members m
    JOIN plans pl ON pl.id = m.plan_id
    WHERE m.plan_id > 0 AND m.plan_expiry > NOW() AND pl.price > 0
  `);

  const mpStatus = await prisma.$queryRawUnsafe<{ status: string; c: bigint }[]>(`
    SELECT
      CASE
        WHEN agreement_cancel IS NOT NULL THEN 'cancelled'
        WHEN agreement_activate IS NOT NULL THEN 'active'
        WHEN paypal_agreement_id IS NOT NULL THEN 'pending'
        ELSE 'incomplete'
      END AS status,
      COUNT(*) AS c
    FROM member_plan
    GROUP BY status
  `);

  console.error("plans / trends…");
  const plans = await prisma.$queryRawUnsafe<
    {
      id: number;
      name: string;
      price: number;
      unit: string;
      no_of_domains: number;
      members: bigint;
    }[]
  >(`
    SELECT p.id, p.name, p.price, p.unit, p.no_of_domains, COUNT(m.id) AS members
    FROM plans p
    LEFT JOIN members m ON m.plan_id = p.id AND (m.plan_expiry IS NULL OR m.plan_expiry > NOW())
    GROUP BY p.id, p.name, p.price, p.unit, p.no_of_domains
    ORDER BY members DESC
  `);

  const signups = await prisma.$queryRawUnsafe<{ month: string; signups: bigint }[]>(
    `
    SELECT DATE_FORMAT(date_signedup, '%Y-%m') AS month, COUNT(*) AS signups
    FROM members
    WHERE date_signedup >= ?
    GROUP BY month ORDER BY month
  `,
    d365
  );

  const payments = await prisma.$queryRawUnsafe<
    { month: string; payments: bigint; revenue: number }[]
  >(
    `
    SELECT DATE_FORMAT(datetime_created, '%Y-%m') AS month, COUNT(*) AS payments,
      COALESCE(SUM(amount),0) AS revenue
    FROM member_payment
    WHERE datetime_created >= ? AND amount > 0
    GROUP BY month ORDER BY month
  `,
    d365
  );

  const paidAvgs = await prisma.$queryRawUnsafe<
    { avg_urls: number; avg_campaigns: number }[]
  >(`
    SELECT
      (SELECT AVG(cnt) FROM (
         SELECT COUNT(*) AS cnt FROM member_urls u
         JOIN members m ON m.id = u.member_id WHERE ${paidM} GROUP BY m.id
       ) x) AS avg_urls,
      (SELECT AVG(cnt) FROM (
         SELECT COUNT(*) AS cnt FROM member_campaigns mc
         JOIN members m ON m.id = mc.member_id WHERE ${paidM} GROUP BY m.id
       ) y) AS avg_campaigns
  `);

  const freeUrlDist = await prisma.$queryRawUnsafe<{ urls: number; members: bigint }[]>(`
    SELECT LEAST(url_count, 5) AS urls, COUNT(*) AS members FROM (
      SELECT m.id, COUNT(u.id) AS url_count
      FROM members m
      LEFT JOIN member_urls u ON u.member_id = m.id
      WHERE ${freeM}
      GROUP BY m.id
    ) t
    GROUP BY LEAST(url_count, 5)
    ORDER BY urls
  `);

  const freeCampDist = await prisma.$queryRawUnsafe<{ camps: number; members: bigint }[]>(`
    SELECT LEAST(camp_count, 5) AS camps, COUNT(*) AS members FROM (
      SELECT m.id, COUNT(mc.id) AS camp_count
      FROM members m
      LEFT JOIN member_campaigns mc ON mc.member_id = m.id
      WHERE ${freeM}
      GROUP BY m.id
    ) t
    GROUP BY LEAST(camp_count, 5)
    ORDER BY camps
  `);

  const recentPaid = await prisma.$queryRawUnsafe<
    {
      id: number;
      email: string;
      plan_name: string;
      price: number;
      urls: bigint;
      camps: bigint;
      signed: string;
      expiry: string;
    }[]
  >(`
    SELECT m.id, m.email, p.name AS plan_name, p.price,
      (SELECT COUNT(*) FROM member_urls u WHERE u.member_id = m.id) AS urls,
      (SELECT COUNT(*) FROM member_campaigns mc WHERE mc.member_id = m.id) AS camps,
      DATE_FORMAT(m.date_signedup, '%Y-%m-%d') AS signed,
      DATE_FORMAT(m.plan_expiry, '%Y-%m-%d') AS expiry
    FROM members m
    JOIN plans p ON p.id = m.plan_id
    WHERE ${paidM}
    ORDER BY m.plan_expiry DESC
    LIMIT 20
  `);

  const freeNoUrl = freeN - freeWithUrl;
  const freeNoCamp = freeN - freeWithCamp;
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

  const out = {
    asOf: now.toISOString(),
    subscriptionStats: {
      active,
      cancelled,
      pending,
      total: totalMp,
      newThisMonth,
      mrr: Number(mrrRows[0]?.mrr ?? 0),
    },
    funnel: {
      total,
      free: freeN,
      paid: paidN,
      paidPct: pct(paidN, total),
      freeWithUrl,
      freeWithCampaign: freeWithCamp,
      freeNoUrl,
      freeNoCampaign: freeNoCamp,
      freeActivatedPct: pct(freeWithCamp, freeN),
      paidWithCampaign: paidWithCamp,
      quietFree90,
      new30,
      new30WithCampaign: new30Camp,
      new30CampPct: pct(new30Camp, new30),
      new30Paid,
      freeMultiUrl,
      paidMultiUrl,
      freeMultiUrlPct: pct(freeMultiUrl, freeN),
      paidMultiUrlPct: pct(paidMultiUrl, paidN),
    },
    freeUrlDist: freeUrlDist.map((r) => ({
      urls: Number(r.urls),
      members: n(r.members),
      label: Number(r.urls) >= 5 ? "5+" : String(r.urls),
    })),
    freeCampDist: freeCampDist.map((r) => ({
      camps: Number(r.camps),
      members: n(r.members),
      label: Number(r.camps) >= 5 ? "5+" : String(r.camps),
    })),
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      domains: Number(p.no_of_domains),
      members: n(p.members),
    })),
    signups12m: signups.map((s) => ({ month: s.month, signups: n(s.signups) })),
    payments12m: payments.map((p) => ({
      month: p.month,
      payments: n(p.payments),
      revenue: Math.round(Number(p.revenue) * 100) / 100,
    })),
    paidAvgs: {
      avgUrls: Math.round(Number(paidAvgs[0]?.avg_urls ?? 0) * 10) / 10,
      avgCampaigns: Math.round(Number(paidAvgs[0]?.avg_campaigns ?? 0) * 10) / 10,
    },
    memberPlanStatus: mpStatus.map((r) => ({ status: r.status, c: n(r.c) })),
    recentPaid: recentPaid.map((r) => ({
      id: r.id,
      email: r.email,
      plan: r.plan_name,
      price: Number(r.price),
      urls: n(r.urls),
      camps: n(r.camps),
      signed: r.signed,
      expiry: r.expiry,
    })),
  };

  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

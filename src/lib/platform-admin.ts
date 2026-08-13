import { prisma } from "@/lib/prisma";

/**
 * True when the member is a platform admin, based on the main (DATABASE_URL)
 * members.is_admin flag (tinyint(1) -> Boolean, 1 = admin).
 */
export async function memberIdIsPlatformAdmin(memberId: number): Promise<boolean> {
  if (!Number.isFinite(memberId)) return false;
  const row = await prisma.members.findUnique({
    where: { id: memberId },
    select: { is_admin: true },
  });
  return row?.is_admin === true;
}

/** Same check for when you already have the member row (avoids a re-query). */
export async function memberRowIsPlatformAdmin(member: {
  id: number;
  is_admin?: boolean | null;
}): Promise<boolean> {
  if (typeof member.is_admin === "boolean") return member.is_admin;
  return memberIdIsPlatformAdmin(member.id);
}

/**
 * All member ids considered platform admins — the `is_admin` flag plus any
 * emails listed in ADMIN_EMAILS. Used to exclude comped/enterprise admin
 * accounts from revenue and subscriber stats.
 */
export async function getPlatformAdminMemberIds(): Promise<number[]> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const rows = await prisma.members.findMany({
    where: {
      OR: [
        { is_admin: true },
        ...(adminEmails.length ? [{ email: { in: adminEmails } }] : []),
      ],
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Member ids to exclude from platform reporting: the team (admins / ADMIN_EMAILS)
 * plus obvious test accounts. Extra test emails can be listed in TEST_EMAILS.
 * Used to keep admin dashboard stats and revenue clean.
 */
export async function getExcludedMemberIds(): Promise<number[]> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const testEmails = (process.env.TEST_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const rows = await prisma.members.findMany({
    where: {
      OR: [
        { is_admin: true },
        ...(adminEmails.length ? [{ email: { in: adminEmails } }] : []),
        ...(testEmails.length ? [{ email: { in: testEmails } }] : []),
        // Common test-account shapes (kept conservative to avoid real users).
        { email: { startsWith: "test" } },
        { email: { contains: "+test" } },
        { email: { contains: "test@" } },
        { email: { contains: "@example." } },
        { email: { contains: "@test." } },
      ],
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

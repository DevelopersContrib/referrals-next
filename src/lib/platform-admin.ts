import { prisma } from "@/lib/prisma";

function parseLowerEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseAdminMemberIds(raw: string | undefined): Set<number> {
  const set = new Set<number>();
  if (!raw?.trim()) return set;
  for (const part of raw.split(",")) {
    const n = parseInt(part.trim(), 10);
    if (!Number.isNaN(n)) set.add(n);
  }
  return set;
}

function adminEmails(): string[] {
  return parseLowerEmails(process.env.ADMIN_EMAILS);
}

function adminMemberIds(): Set<number> {
  return parseAdminMemberIds(process.env.ADMIN_MEMBER_IDS);
}

/** True when email is listed in ADMIN_EMAILS (comma-separated, case-insensitive). */
export function emailIsPlatformAdmin(email: string | null | undefined): boolean {
  const list = adminEmails();
  if (!list.length || !email?.trim()) return false;
  return list.includes(email.trim().toLowerCase());
}

/** True when member id is in ADMIN_MEMBER_IDS or email is in ADMIN_EMAILS. */
export function memberRowIsPlatformAdmin(member: {
  id: number;
  email: string | null;
}): boolean {
  if (adminMemberIds().has(member.id)) return true;
  return emailIsPlatformAdmin(member.email);
}

/**
 * Platform operators: same rules as memberRowIsPlatformAdmin, for when you only have id.
 */
export async function memberIdIsPlatformAdmin(memberId: number): Promise<boolean> {
  if (adminMemberIds().has(memberId)) return true;
  const emails = adminEmails();
  if (!emails.length) return false;
  const row = await prisma.members.findUnique({
    where: { id: memberId },
    select: { email: true },
  });
  return emailIsPlatformAdmin(row?.email ?? null);
}

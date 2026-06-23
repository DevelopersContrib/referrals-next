import { prisma } from "@/lib/prisma";

/**
 * Platform admins are defined ONLY by the `ADMIN_EMAILS` env var
 * (comma-separated; `ADMIN_EMAIL` is accepted as a single-value alias).
 * No database flag grants admin — the env var is the single source of truth.
 *
 *   ADMIN_EMAILS=admin@vnoc.com,ops@vnoc.com
 */
function adminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** True when `email` is listed in ADMIN_EMAILS. */
export function emailIsPlatformAdmin(email: string | null | undefined): boolean {
  const e = email?.trim().toLowerCase();
  if (!e) return false;
  return adminEmailSet().has(e);
}

/** True when the member's email is an admin email. */
export async function memberRowIsPlatformAdmin(member: {
  id: number;
  email: string | null;
}): Promise<boolean> {
  return emailIsPlatformAdmin(member.email);
}

/** Same as memberRowIsPlatformAdmin, for when you only have the member id. */
export async function memberIdIsPlatformAdmin(memberId: number): Promise<boolean> {
  const row = await prisma.members.findUnique({
    where: { id: memberId },
    select: { email: true },
  });
  return emailIsPlatformAdmin(row?.email ?? null);
}

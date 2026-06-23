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

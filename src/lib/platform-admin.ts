import { prisma } from "@/lib/prisma";
import { vnocPrisma } from "@/lib/vnoc-db";

async function vnocMemberIsAdmin(email: string | null | undefined): Promise<boolean> {
  if (!vnocPrisma || !email?.trim()) {
    console.log("[isAdmin] skip VNOC check", {
      hasVnocDb: Boolean(vnocPrisma),
      email: email ?? null,
    });
    return false;
  }

  const rows = await vnocPrisma.$queryRaw<Array<{ is_admin: number }>>`
    SELECT is_admin
    FROM members
    WHERE email = ${email.trim()}
      AND is_admin = 1
    LIMIT 1
  `;

  const isAdmin = rows.length > 0;
  console.log("[isAdmin] VNOC lookup", { email: email.trim(), isAdmin, rowCount: rows.length });
  return isAdmin;
}

/** True when the member is an admin in the VNOC database (members.is_admin = 1). */
export async function memberRowIsPlatformAdmin(member: {
  id: number;
  email: string | null;
}): Promise<boolean> {
  return vnocMemberIsAdmin(member.email);
}

/** Same as memberRowIsPlatformAdmin, for when you only have the referrals member id. */
export async function memberIdIsPlatformAdmin(memberId: number): Promise<boolean> {
  const row = await prisma.members.findUnique({
    where: { id: memberId },
    select: { email: true },
  });
  return vnocMemberIsAdmin(row?.email ?? null);
}

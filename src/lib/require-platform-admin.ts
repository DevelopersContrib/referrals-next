import { auth } from "@/lib/auth";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";

type SessionUser = { id?: string; isAdmin?: boolean };

export async function sessionIsPlatformAdmin(
  user: SessionUser | undefined
): Promise<boolean> {
  if (!user?.id) return false;
  if (user.isAdmin) return true;
  const memberId = parseInt(user.id, 10);
  if (!Number.isFinite(memberId)) return false;
  return memberIdIsPlatformAdmin(memberId);
}

export async function requirePlatformAdminApi(): Promise<
  { ok: true; memberId: number } | { ok: false; status: 401 | 403 }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, status: 401 };

  const memberId = parseInt(session.user.id, 10);
  if (!Number.isFinite(memberId)) return { ok: false, status: 401 };

  const isAdmin = await sessionIsPlatformAdmin(session.user as SessionUser);
  if (!isAdmin) return { ok: false, status: 403 };

  return { ok: true, memberId };
}

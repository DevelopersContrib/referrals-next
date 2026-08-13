/**
 * Compatibility shim so Handyman-style engagement API routes can call
 * `requireAdminApi()` while Referrals uses platform-admin session checks.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sessionIsPlatformAdmin } from "@/lib/require-platform-admin";

type SessionUser = { id?: string; email?: string | null; isAdmin?: boolean };

export async function requireAdminApi(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const ok = await sessionIsPlatformAdmin(session.user as SessionUser);
  if (!ok) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: session.user as SessionUser };
}

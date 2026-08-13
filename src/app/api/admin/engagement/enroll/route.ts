import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/panel-admin-api";
import { prisma } from "@/lib/prisma";
import { enrollRfMemberActivation } from "@/lib/engagement";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** POST /api/admin/engagement/enroll — enroll a member by email (test). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    memberId?: number;
    contractorId?: number;
  };
  let memberId = Number(body.memberId || body.contractorId || 0);

  if (!memberId && body.email) {
    const email = normalizeEmail(body.email);
    const row = await prisma.members.findFirst({
      where: { email },
      select: { id: true },
    });
    memberId = row?.id ?? 0;
  }

  if (!memberId) {
    return NextResponse.json({ error: "member not found" }, { status: 404 });
  }

  const result = await enrollRfMemberActivation(memberId);
  if (result.ok === false) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    memberId,
    enrollmentId: result.enrollmentId,
    created: result.created,
  });
}

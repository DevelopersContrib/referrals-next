import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  const activePlan = await prisma.member_plan.findFirst({
    where: { member_id: memberId, agreement_cancel: null },
    orderBy: { id: "desc" },
  });

  if (!activePlan) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  await prisma.member_plan.update({
    where: { id: activePlan.id },
    data: { agreement_cancel: "suspended" },
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);

  // Find latest subscription with a cancel record
  const cancelledPlan = await prisma.member_plan.findFirst({
    where: {
      member_id: memberId,
      agreement_cancel: { not: null },
    },
    orderBy: { id: "desc" },
  });

  if (!cancelledPlan) {
    return NextResponse.json({ error: "No cancelled subscription found" }, { status: 404 });
  }

  // Clear cancel flag
  await prisma.member_plan.update({
    where: { id: cancelledPlan.id },
    data: { agreement_cancel: null, agreement_activate: new Date().toISOString() },
  });

  // Extend member expiry
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  await prisma.members.update({
    where: { id: memberId },
    data: { plan_expiry: expiry },
  });

  return NextResponse.json({ success: true });
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMemberOnPaidPlan } from "@/lib/member-subscription";
import { DashboardClientRoot } from "./dashboard-client-root";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const [member, isPaid] = await Promise.all([
    prisma.members.findUnique({
      where: { id: memberId },
      select: { is_verified: true },
    }),
    isMemberOnPaidPlan(memberId),
  ]);

  return (
    <DashboardClientRoot
      onboarding={{
        isVerified: Boolean(member?.is_verified),
        isPaid,
      }}
    >
      {children}
    </DashboardClientRoot>
  );
}

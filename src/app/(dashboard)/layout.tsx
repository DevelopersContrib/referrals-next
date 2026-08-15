import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMemberEntitlement } from "@/lib/member-subscription";
import { DashboardClientRoot } from "./dashboard-client-root";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const [member, entitlement, brands] = await Promise.all([
    prisma.members.findUnique({
      where: { id: memberId },
      select: { is_verified: true },
    }),
    getMemberEntitlement(memberId),
    prisma.member_urls.findMany({
      where: { member_id: memberId },
      orderBy: { date_added: "desc" },
      select: { id: true, domain: true },
      take: 20,
    }),
  ]);

  return (
    <DashboardClientRoot
      brands={brands}
      onboarding={{
        isVerified: Boolean(member?.is_verified),
        isGrowth: entitlement.isGrowth,
        status: entitlement.status,
        daysLeft: entitlement.daysLeft,
      }}
    >
      {children}
    </DashboardClientRoot>
  );
}

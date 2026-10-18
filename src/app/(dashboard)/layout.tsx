import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClientRoot } from "./dashboard-client-root";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);
  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "desc" },
    select: { id: true, domain: true, logo_url: true },
    // Recent brands for the switcher. Network owners have 20k+; the sidebar
    // fetches the brand you're in if it isn't one of these.
    take: 50,
  });

  return (
    <DashboardClientRoot brands={brands}>
      {children}
    </DashboardClientRoot>
  );
}

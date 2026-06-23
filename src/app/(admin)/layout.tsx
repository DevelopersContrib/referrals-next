import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { auth } from "@/lib/auth";
import { sessionIsPlatformAdmin } from "@/lib/require-platform-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authorization gate for the entire /admin area. proxy.ts already blocks
  // anonymous users (redirect to /signin); here we enforce that the signed-in
  // user is a platform admin (ADMIN_EMAILS). Non-admins are bounced to their
  // own dashboard. This is the single chokepoint for admin *pages*; admin API
  // routes enforce the same via requirePlatformAdminApi().
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/admin");
  const isAdmin = await sessionIsPlatformAdmin(
    session.user as { id?: string; isAdmin?: boolean }
  );
  if (!isAdmin) redirect("/dashboard");

  return (
    <SessionProvider>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}

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
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  if (!(await sessionIsPlatformAdmin(session.user))) redirect("/dashboard");

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

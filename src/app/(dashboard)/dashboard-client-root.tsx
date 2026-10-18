"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

type Props = {
  children: React.ReactNode;
  brands: { id: number; domain: string; logo_url?: string | null }[];
};

export function DashboardClientRoot({ children, brands }: Props) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <DashboardSidebar brands={brands} />
        <SidebarInset>
          <DashboardHeader />
          <main className="min-w-0 max-w-full flex-1 bg-dashboard p-4 lg:p-6 xl:p-8">
            {children}
          </main>
          <footer className="border-t border-[#ebeef0] bg-white px-4 py-3 lg:px-6">
            <p className="text-xs text-[#a7abc3]">
              2026 &copy; Referrals.com &mdash; Grow your business with referral
              marketing
            </p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}

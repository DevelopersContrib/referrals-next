"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { PaidOnboardingBanner } from "@/components/dashboard/paid-onboarding-banner";

type Props = {
  children: React.ReactNode;
  onboarding: { isVerified: boolean; isPaid: boolean };
};

export function DashboardClientRoot({ children, onboarding }: Props) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto bg-dashboard p-4 md:p-6 lg:p-8">
            <PaidOnboardingBanner
              isVerified={onboarding.isVerified}
              isPaid={onboarding.isPaid}
            />
            {children}
          </main>
          <footer className="border-t border-[#ebeef0] bg-white px-6 py-3">
            <p className="text-xs text-[#a7abc3]">
              2026 &copy; Referrals.com &mdash; Grow your business with referral marketing
            </p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}

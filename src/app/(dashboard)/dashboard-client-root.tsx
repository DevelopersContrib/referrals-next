"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { PaidOnboardingBanner } from "@/components/dashboard/paid-onboarding-banner";

type Props = {
  children: React.ReactNode;
  brands: { id: number; domain: string }[];
  onboarding: {
    isVerified: boolean;
    isGrowth: boolean;
    status: "trial" | "free_capped" | "paid" | "unverified";
    daysLeft: number | null;
  };
};

export function DashboardClientRoot({ children, brands, onboarding }: Props) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <DashboardSidebar brands={brands} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto bg-dashboard p-4 lg:p-6 xl:p-8">
            <PaidOnboardingBanner
              isVerified={onboarding.isVerified}
              isGrowth={onboarding.isGrowth}
              status={onboarding.status}
              daysLeft={onboarding.daysLeft}
            />
            {children}
          </main>
          <footer className="border-t border-[#ebeef0] bg-white px-4 py-3 lg:px-6">
            <p className="text-xs text-[#a7abc3]">
              2026 &copy; Referrals.com &mdash; Grow your business with referral marketing
            </p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}

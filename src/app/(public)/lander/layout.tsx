import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landing Page | Referrals.com",
  description: "Start your referral marketing journey. Sign up and create your first campaign.",
  openGraph: { title: "Get Started | Referrals.com", url: "https://referrals.com/lander" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

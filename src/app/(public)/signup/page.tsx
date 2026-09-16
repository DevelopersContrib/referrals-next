import type { Metadata } from "next";
import { getSocialProofStats } from "@/lib/social-proof";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Start your 14-day Growth trial — Referrals.com",
  description:
    "Create your Referrals.com account and get 14 days of full Growth features — no credit card. Then $9/mo per brand. VNOC / network domains stay free.",
  openGraph: {
    title: "Start your 14-day Growth trial — Referrals.com",
    description:
      "14-day Growth trial, no credit card. Then $9/mo per brand. VNOC / network domains stay free.",
    url: "https://referrals.com/signup",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start your 14-day Growth trial — Referrals.com",
    description:
      "14-day Growth trial, no credit card. Then $9/mo per brand. VNOC / network domains stay free.",
  },
};

export default async function SignUpPage() {
  const stats = await getSocialProofStats();

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <SignupForm />
      </div>
      <AuthHeroPanel stats={stats} variant="signup" />
    </div>
  );
}

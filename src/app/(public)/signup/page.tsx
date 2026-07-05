import type { Metadata } from "next";
import { getSocialProofStats } from "@/lib/social-proof";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up free — Referrals.com",
  description:
    "Create your free Referrals.com account and launch a referral program your customers love to share. No credit card required.",
  openGraph: {
    title: "Sign up free — Referrals.com",
    description:
      "Join 500k+ businesses growing with referral marketing. Launch your first campaign free in minutes.",
    url: "https://referrals.com/signup",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign up free — Referrals.com",
    description:
      "Join 500k+ businesses growing with referral marketing. Launch your first campaign free in minutes.",
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

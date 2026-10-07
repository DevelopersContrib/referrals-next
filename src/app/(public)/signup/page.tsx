import type { Metadata } from "next";
import { getSocialProofStats } from "@/lib/social-proof";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { SignupForm } from "@/components/auth/signup-form";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your Referrals.com account, set up a brand, and pay $9/mo per brand to publish.",
  openGraph: {
    title: "Create your account — Referrals.com",
    description:
      "Set up a brand for free. Pay $9/mo per brand to publish it and accept signups.",
    url: siteUrl("/signup"),
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create your account — Referrals.com",
    description:
      "Set up a brand for free. Pay $9/mo per brand to publish it and accept signups.",
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

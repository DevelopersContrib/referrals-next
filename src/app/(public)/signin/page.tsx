import type { Metadata } from "next";
import { getSocialProofStats } from "@/lib/social-proof";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { SignInForm } from "@/components/auth/signin-form";
import { NetworkViaNote } from "@/components/auth/network-via-note";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Referrals.com account to manage campaigns, track referrals, and grow your business.",
  openGraph: {
    title: "Sign in — Referrals.com",
    description:
      "Sign in to your Referrals.com account and keep your referral programs growing.",
    url: "https://www.referrals.com/signin",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in — Referrals.com",
    description:
      "Sign in to your Referrals.com account and keep your referral programs growing.",
  },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ via?: string | string[] }>;
}) {
  const [stats, { via }] = await Promise.all([getSocialProofStats(), searchParams]);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <NetworkViaNote via={via} />
        <SignInForm />
      </div>
      <AuthHeroPanel stats={stats} variant="signin" />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { countMemberBrands } from "@/lib/member-subscription";
import { BrandAnalyzer } from "@/components/onboarding/brand-analyzer";

export const metadata: Metadata = {
  title: "Get started — Referrals.com",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/onboarding");

  const memberId = parseInt(session.user.id, 10);
  const brandCount = await countMemberBrands(memberId);
  if (brandCount > 0) redirect("/dashboard");

  const firstName = (session.user.name || session.user.email || "").split(/[\s@]+/)[0] || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/40 to-orange-50/40">
      <BrandAnalyzer firstName={firstName} />
    </div>
  );
}

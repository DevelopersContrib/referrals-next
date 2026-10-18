import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { countMemberBrands } from "@/lib/member-subscription";
import { BrandAnalyzer } from "@/components/onboarding/brand-analyzer";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import { prisma } from "@/lib/prisma";

async function isMemberVerified(memberId: number) {
  const m = await prisma.members.findUnique({
    where: { id: memberId },
    select: { is_verified: true },
  });
  return Boolean(m?.is_verified);
}

export const metadata: Metadata = {
  title: "Get started",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/onboarding");

  const memberId = parseInt(session.user.id, 10);
  const firstName = (session.user.name || session.user.email || "").split(/[\s@]+/)[0] || undefined;

  // Members who already started: pick up their latest analysis while the brand
  // still has no campaign (refresh, back button, came back later). Anyone with
  // a campaign goes to the dashboard.
  let resume: { jobId: number; url: string } | null = null;
  const brandCount = await countMemberBrands(memberId);
  if (brandCount > 0) {
    const job = await prisma.brand_analysis.findFirst({
      where: { member_id: memberId, url_id: { not: null } },
      orderBy: { id: "desc" },
      select: { id: true, url_id: true, input_url: true },
    });
    const brandStillThere = job?.url_id
      ? await prisma.member_urls.count({ where: { id: job.url_id, member_id: memberId } })
      : 0;
    const campaignCount = job?.url_id
      ? await prisma.member_campaigns.count({ where: { url_id: job.url_id } })
      : 1;
    if (!job || !brandStillThere || campaignCount > 0) redirect("/dashboard");
    resume = { jobId: job.id, url: job.input_url };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/40 to-orange-50/40">
      {session.user.email && !(await isMemberVerified(memberId)) && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <VerifyEmailBanner email={session.user.email} />
        </div>
      )}
      <BrandAnalyzer
        firstName={firstName}
        resumeJobId={resume?.jobId}
        resumeUrl={resume?.url}
      />
    </div>
  );
}

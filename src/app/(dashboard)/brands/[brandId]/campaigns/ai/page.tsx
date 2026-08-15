import { auth } from "@/lib/auth";
import { getBrandIfAccessible } from "@/lib/brand-access";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { AiCampaignPicker } from "@/components/campaigns/ai-campaign-picker";

interface AiCampaignPageProps {
  params: Promise<{ brandId: string }>;
}

export default async function AiCampaignBuilderPage({
  params,
}: AiCampaignPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);
  const urlId = parseInt(brandId, 10);
  if (isNaN(urlId)) notFound();

  const brand = await getBrandIfAccessible(urlId, memberId, isAdmin);
  if (!brand) notFound();

  const latestAnalysis = await prisma.brand_analysis.findFirst({
    where: { url_id: urlId },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  return (
    <div>
      <Link
        href={`/brands/${brandId}/campaigns/new`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#a7abc3] transition-colors hover:text-[#575962]"
      >
        <ArrowLeftIcon className="size-4" />
        Back to create campaign
      </Link>

      <div className="mb-6 rounded-xl border border-[#ebeef0] bg-gradient-to-r from-white to-rose-50/30 px-4 py-4 sm:px-5">
        <h1 className="text-2xl font-bold text-[#575962]">AI campaign builder</h1>
        <p className="mt-1 text-sm text-[#a7abc3]">
          We already analyzed{" "}
          <span className="font-medium text-[#575962]">{brand.domain}</span>. Pick
          the goal, color, design, and copy — then we&apos;ll design three campaigns.
        </p>
      </div>

      <AiCampaignPicker
        brandId={brandId}
        brandUrl={brand.url}
        initialJobId={latestAnalysis?.id ?? null}
        hideHeading
        askBrief
        brandColors={brand.brand_colors}
      />
    </div>
  );
}

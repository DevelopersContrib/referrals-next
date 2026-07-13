import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isMemberOnPaidPlan } from "@/lib/member-subscription";
import { BrandEditPanel } from "@/components/brands/brand-edit-panel";
import { BrandReferralLink } from "@/components/brands/brand-referral-link";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

interface EditBrandPageProps {
  params: Promise<{ brandId: string }>;
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const memberId = parseInt(session.user.id, 10);
  const isPremium = await isMemberOnPaidPlan(memberId);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <span>Manage Brand</span>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">Edit Brand</span>
      </nav>

      <Suspense
        fallback={
          <div className="py-16 text-center text-[#a7abc3]">Loading...</div>
        }
      >
        <BrandEditPanel brandId={brandId} isPremium={isPremium} />
      </Suspense>

      <BrandReferralLink brandId={brandId} />
    </div>
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  brandShouldShowUpgradeCta,
  getBrandEntitlement,
} from "@/lib/member-subscription";
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
  const brandIdNum = parseInt(brandId, 10);
  const entitlement = await getBrandEntitlement(brandIdNum, {
    applyAdminBypass: false,
  });
  // Whitelabel / remove branding is paid-only for this brand (not trial).
  const isPremium = Boolean(entitlement?.isPaid);
  const showUpgradeCta = brandShouldShowUpgradeCta(entitlement);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-[#6b7280]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3 shrink-0 text-[#9ca3af]" />
        <Link href="/brands" className="transition-colors hover:text-brand">
          Manage Brand
        </Link>
        <ChevronRightIcon className="size-3 shrink-0 text-[#9ca3af]" />
        <span className="font-medium text-[#374151]">Edit Brand</span>
      </nav>

      <Suspense
        fallback={
          <div className="py-16 text-center text-[#a7abc3]">Loading...</div>
        }
      >
        <BrandEditPanel
          brandId={brandId}
          isPremium={isPremium}
          showUpgradeCta={showUpgradeCta}
        />
      </Suspense>

      <BrandReferralLink brandId={brandId} />
    </div>
  );
}

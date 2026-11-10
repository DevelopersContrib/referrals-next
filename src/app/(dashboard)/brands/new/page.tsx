import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandAnalyzer } from "@/components/onboarding/brand-analyzer";

export const metadata: Metadata = {
  title: "New brand",
  robots: { index: false, follow: false },
};

export default function NewBrandPage() {
  return (
    <div>
      <div className="mb-2 flex items-center gap-4">
        <Link href="/brands">
          <Button variant="ghost" size="sm">
            &larr; Back to Brands
          </Button>
        </Link>
      </div>
      <BrandAnalyzer skipSlotGate />
    </div>
  );
}

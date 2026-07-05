import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandAnalyzer } from "@/components/onboarding/brand-analyzer";

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
      <BrandAnalyzer />
    </div>
  );
}

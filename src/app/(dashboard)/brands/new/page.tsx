"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandForm, type BrandFormData } from "@/components/brands/brand-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewBrandPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: BrandFormData) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          description: data.description || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create brand");
      }

      toast.success("Brand created successfully");
      router.push("/brands");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create brand"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/brands">
          <Button variant="ghost" size="sm">
            &larr; Back to Brands
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Brand</h1>
          <p className="mt-1 text-muted-foreground">
            Register a new brand to start creating referral campaigns.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <BrandForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          title="New Brand"
          minimal
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandForm, type BrandFormData } from "@/components/brands/brand-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditBrandPageProps {
  params: Promise<{ brandId: string }>;
}

interface BrandData {
  id: number;
  url: string;
  description: string | null;
  logo_url: string | null;
  background_image: string | null;
  slug: string | null;
  domain: string;
}

export default function EditBrandPage({ params }: EditBrandPageProps) {
  const { brandId } = use(params);
  const router = useRouter();
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const res = await fetch(`/api/brands/${brandId}`);
        if (!res.ok) {
          throw new Error("Brand not found");
        }
        const data = await res.json();
        setBrand(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load brand");
      } finally {
        setIsFetching(false);
      }
    }
    fetchBrand();
  }, [brandId]);

  async function handleSubmit(data: BrandFormData) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          description: data.description || null,
          logo_url: data.logo_url || null,
          background_image: data.background_image || null,
          slug: data.slug || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update brand");
      }

      toast.success("Brand updated successfully");
      router.push(`/brands/${brandId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update brand"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete brand");
      }

      toast.success("Brand deleted successfully");
      router.push("/brands");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete brand"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading brand...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error || "Brand not found"}</p>
        <Link href="/brands" className="mt-4 inline-block">
          <Button variant="outline">Back to Brands</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/brands/${brandId}`}>
          <Button variant="ghost" size="sm">
            &larr; Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit {brand.domain}</h1>
          <p className="mt-1 text-muted-foreground">
            Update your brand details.
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <BrandForm
          initialData={{
            url: brand.url,
            description: brand.description ?? "",
            logo_url: brand.logo_url ?? "",
            background_image: brand.background_image ?? "",
            slug: brand.slug ?? "",
          }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          title="Edit Brand"
        />

        <div className="rounded-lg border border-destructive/50 p-4">
          <h3 className="font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting a brand will remove it permanently. This action cannot be
            undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete Brand
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Brand {
  id: number;
  url: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  member_id: number;
  slug: string | null;
  background_image: string | null;
  date_added: string;
}

export default function AdminEditBrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    url: "",
    description: "",
    logo_url: "",
    slug: "",
    background_image: "",
    transfer_member_id: "",
  });

  useEffect(() => {
    fetch(`/api/admin/brands/${brandId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setBrand(data);
        setForm({
          url: data.url || "",
          description: data.description || "",
          logo_url: data.logo_url || "",
          slug: data.slug || "",
          background_image: data.background_image || "",
          transfer_member_id: "",
        });
      })
      .catch(() => setError("Failed to load brand"))
      .finally(() => setLoading(false));
  }, [brandId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        url: form.url,
        description: form.description,
        logo_url: form.logo_url,
        slug: form.slug,
        background_image: form.background_image,
      };

      if (form.transfer_member_id) {
        payload.member_id = parseInt(form.transfer_member_id, 10);
      }

      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update brand");
      }

      setSuccess("Brand updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this brand? All associated campaigns will be orphaned."))
      return;

    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/brands");
    } catch {
      setError("Failed to delete brand");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading brand...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Brand not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Brand #{brand.id}</h1>
          <p className="text-muted-foreground">
            {brand.domain} | Owner ID: {brand.member_id} | Added:{" "}
            {new Date(brand.date_added).toLocaleDateString()}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Brand
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Brand Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="background_image">Background Image URL</Label>
              <Input
                id="background_image"
                value={form.background_image}
                onChange={(e) =>
                  setForm({ ...form, background_image: e.target.value })
                }
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="transfer">Transfer to Member ID</Label>
              <Input
                id="transfer"
                type="number"
                value={form.transfer_member_id}
                onChange={(e) =>
                  setForm({ ...form, transfer_member_id: e.target.value })
                }
                placeholder="Enter member ID to transfer ownership"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to keep current owner (ID: {brand.member_id})
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/brands")}
              >
                Back to Brands
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

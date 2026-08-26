"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlugAvailabilityField } from "@/components/brands/slug-availability-field";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { slugFromWebsite } from "@/lib/brand-slug";

export default function AdminNewBrandPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [form, setForm] = useState({
    url: "",
    member_id: "",
    description: "",
    logo_url: "",
    background_image: "",
  });

  const slug = customSlug ?? slugFromWebsite(form.url);
  const availability = useSlugAvailability(slug, {
    enabled: form.url.trim().length > 3,
  });
  const slugBlocked =
    availability.status === "taken" || availability.status === "invalid";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugBlocked) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.suggestion) setCustomSlug(data.suggestion);
        throw new Error(data.error || "Failed to create brand");
      }

      router.push("/admin/brands");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-bold">Add New Brand</h1>
      <p className="text-muted-foreground">
        Create a brand URL and reserve its public address.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600"
          >
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Brand details</CardTitle>
            <CardDescription>
              The website and the member who owns it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member_id">Member ID</Label>
              <Input
                id="member_id"
                type="number"
                value={form.member_id}
                onChange={(e) =>
                  setForm({ ...form, member_id: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Short summary shown on the public page"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public page</CardTitle>
            <CardDescription>
              Derived from the website. Change it before creating if it is
              already taken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SlugAvailabilityField
              value={slug}
              onChange={(next) => setCustomSlug(next || null)}
              label="Address"
              hint="Enter a website above to generate an address."
              availability={availability}
              disabled={saving}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
            <CardDescription>Optional imagery for the brand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background_image">Background image</Label>
              <Input
                id="background_image"
                value={form.background_image}
                onChange={(e) =>
                  setForm({ ...form, background_image: e.target.value })
                }
                placeholder="https://example.com/hero.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            disabled={saving || slugBlocked}
            title={
              slugBlocked ? "Pick an available public address first" : undefined
            }
          >
            {saving ? "Creating..." : "Create Brand"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/brands")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

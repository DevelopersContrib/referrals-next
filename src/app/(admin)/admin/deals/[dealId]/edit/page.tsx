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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: number;
  category_id: number;
  url_id: number;
  member_id: number;
  title: string;
  description: string | null;
  price: string | null;
  banner: string | null;
  url: string | null;
  how_to: string | null;
  date_end: string | null;
  date_created: string | null;
}

export default function AdminEditDealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    category_id: "0",
    url_id: "0",
    member_id: "0",
    price: "",
    banner: "",
    url: "",
    description: "",
    how_to: "",
    date_end: "",
  });

  useEffect(() => {
    fetch(`/api/admin/deals/${dealId}`)
      .then((r) => r.json())
      .then((data: Deal) => {
        setDeal(data);
        setForm({
          title: data.title || "",
          category_id: String(data.category_id ?? 0),
          url_id: String(data.url_id ?? 0),
          member_id: String(data.member_id ?? 0),
          price: data.price || "",
          banner: data.banner || "",
          url: data.url || "",
          description: data.description || "",
          how_to: data.how_to || "",
          date_end: data.date_end || "",
        });
      })
      .catch(() => setError("Failed to load deal"))
      .finally(() => setLoading(false));
  }, [dealId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update deal");
      }

      setSuccess("Deal updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm("Are you sure you want to delete this deal? This cannot be undone.")
    )
      return;

    try {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/deals");
    } catch {
      setError("Failed to delete deal");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading deal...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Deal not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Deal #{deal.id}</h1>
          <p className="text-muted-foreground">
            {deal.date_created
              ? `Created ${new Date(deal.date_created).toLocaleDateString()}`
              : "No creation date"}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Deal
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category_id">Category ID</Label>
                <Input
                  id="category_id"
                  type="number"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="url_id">Brand (URL) ID</Label>
                <Input
                  id="url_id"
                  type="number"
                  value={form.url_id}
                  onChange={(e) => setForm({ ...form, url_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="member_id">Member ID</Label>
                <Input
                  id="member_id"
                  type="number"
                  value={form.member_id}
                  onChange={(e) =>
                    setForm({ ...form, member_id: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 49.99"
                />
              </div>
              <div>
                <Label htmlFor="date_end">End Date</Label>
                <Input
                  id="date_end"
                  value={form.date_end}
                  onChange={(e) =>
                    setForm({ ...form, date_end: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="banner">Banner</Label>
              <Input
                id="banner"
                value={form.banner}
                onChange={(e) => setForm({ ...form, banner: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="how_to">How To</Label>
              <Textarea
                id="how_to"
                value={form.how_to}
                onChange={(e) => setForm({ ...form, how_to: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/deals")}
              >
                Back to Deals
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Badge variant="secondary">ID: {deal.id}</Badge>
          <Badge variant="secondary">Brand: #{deal.url_id}</Badge>
          <Badge variant="secondary">Member: #{deal.member_id}</Badge>
          <Badge variant={deal.price ? "default" : "secondary"}>
            {deal.price ? `$${deal.price}` : "Free"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

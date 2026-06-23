"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Coupon {
  id: number;
  campaign_id: number;
  code: string | null;
  is_used: boolean | null;
}

export default function AdminEditCouponPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const { couponId } = use(params);
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    campaign_id: "",
    code: "",
    is_used: false,
  });

  useEffect(() => {
    fetch(`/api/admin/coupons/${couponId}`)
      .then((r) => r.json())
      .then((data: Coupon) => {
        setCoupon(data);
        setForm({
          campaign_id: String(data.campaign_id ?? ""),
          code: data.code || "",
          is_used: data.is_used || false,
        });
      })
      .catch(() => setError("Failed to load coupon"))
      .finally(() => setLoading(false));
  }, [couponId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: form.campaign_id,
          code: form.code,
          is_used: form.is_used,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update coupon");
      }

      toast.success("Coupon updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm("Are you sure you want to delete this coupon? This cannot be undone.")
    )
      return;

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Coupon deleted");
      router.push("/admin/coupons");
    } catch {
      setError("Failed to delete coupon");
      toast.error("Failed to delete coupon");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading coupon...</p>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Coupon not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Coupon #{coupon.id}</h1>
          <p className="text-muted-foreground">
            Campaign #{coupon.campaign_id}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Coupon
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="campaign_id">Campaign ID</Label>
              <Input
                id="campaign_id"
                type="number"
                value={form.campaign_id}
                onChange={(e) =>
                  setForm({ ...form, campaign_id: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Coupon code"
              />
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_used"
                checked={form.is_used}
                onChange={(e) =>
                  setForm({ ...form, is_used: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="is_used">Used</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/coupons")}
              >
                Back to Coupons
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
          <Badge variant="secondary">ID: {coupon.id}</Badge>
          <Badge variant="secondary">Campaign: #{coupon.campaign_id}</Badge>
          <Badge variant={coupon.is_used ? "destructive" : "default"}>
            {coupon.is_used ? "Used" : "Available"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

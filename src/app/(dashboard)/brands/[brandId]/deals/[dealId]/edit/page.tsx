"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", link: "", coupon_code: "" });

  useEffect(() => {
    fetch(`/api/deals/${params.dealId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.deal) {
          setForm({
            title: data.deal.title || "",
            description: data.deal.description || "",
            link: data.deal.link || "",
            coupon_code: data.deal.coupon_code || "",
          });
        }
      });
  }, [params.dealId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${params.dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push(`/brands/${params.brandId}/deals`);
    } catch {
      alert("Failed to update");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/deals/${params.dealId}`, { method: "DELETE" });
    router.push(`/brands/${params.brandId}/deals`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Deal</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input id="link" type="url" value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon Code</Label>
              <Input id="coupon_code" value={form.coupon_code} onChange={(e) => setForm((p) => ({ ...p, coupon_code: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

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

export default function AdminEditPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    price: "",
    campaigns_participants: "",
    no_of_domains: "",
    unit: "month",
    no_unit: "",
    days: "",
  });

  useEffect(() => {
    fetch(`/api/admin/plans/${planId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setForm({
          name: data.name || "",
          price: data.price != null ? String(data.price) : "",
          campaigns_participants:
            data.campaigns_participants != null
              ? String(data.campaigns_participants)
              : "",
          no_of_domains:
            data.no_of_domains != null ? String(data.no_of_domains) : "",
          unit: data.unit || "month",
          no_unit: data.no_unit != null ? String(data.no_unit) : "",
          days: data.days != null ? String(data.days) : "",
        });
      })
      .catch(() => setError("Failed to load plan"))
      .finally(() => setLoading(false));
  }, [planId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update plan");
      }

      setSuccess("Plan updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      router.push("/admin/plans");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading plan...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Plan #{planId}</h1>
          <p className="text-muted-foreground">Modify plan configuration.</p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Plan
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
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
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit">Billing Unit</Label>
                <select
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaigns_participants">Max Participants</Label>
                <Input
                  id="campaigns_participants"
                  type="number"
                  value={form.campaigns_participants}
                  onChange={(e) =>
                    setForm({ ...form, campaigns_participants: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="no_of_domains">Max Domains</Label>
                <Input
                  id="no_of_domains"
                  type="number"
                  value={form.no_of_domains}
                  onChange={(e) =>
                    setForm({ ...form, no_of_domains: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="no_unit">Billing Periods</Label>
                <Input
                  id="no_unit"
                  type="number"
                  value={form.no_unit}
                  onChange={(e) =>
                    setForm({ ...form, no_unit: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="days">Duration (Days)</Label>
                <Input
                  id="days"
                  type="number"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/plans")}
              >
                Back to Plans
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

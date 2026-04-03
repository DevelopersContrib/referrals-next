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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: number;
  name: string;
  type_id: number;
  url_id: number;
  member_id: number;
  reward_type: number;
  publish: string | null;
  goal_type: string | null;
  num_visits: number | null;
  num_signups: number | null;
  allow_email: boolean | null;
  date_added: string;
}

export default function AdminEditCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    type_id: "1",
    publish: "public",
    goal_type: "visit",
    num_visits: "",
    num_signups: "",
    allow_email: false,
  });

  useEffect(() => {
    fetch(`/api/admin/campaigns/${campaignId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setCampaign(data);
        setForm({
          name: data.name || "",
          type_id: String(data.type_id || 1),
          publish: data.publish || "public",
          goal_type: data.goal_type || "visit",
          num_visits: data.num_visits != null ? String(data.num_visits) : "",
          num_signups: data.num_signups != null ? String(data.num_signups) : "",
          allow_email: data.allow_email || false,
        });
      })
      .catch(() => setError("Failed to load campaign"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type_id: parseInt(form.type_id, 10),
          publish: form.publish,
          goal_type: form.goal_type,
          num_visits: form.num_visits ? parseInt(form.num_visits, 10) : null,
          num_signups: form.num_signups ? parseInt(form.num_signups, 10) : null,
          allow_email: form.allow_email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update campaign");
      }

      setSuccess("Campaign updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Campaign not found</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Edit Campaign #{campaign.id}</h1>
        <p className="text-muted-foreground">
          Brand ID: {campaign.url_id} | Owner ID: {campaign.member_id} |
          Created: {new Date(campaign.date_added).toLocaleDateString()}
        </p>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
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
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type_id">Type ID</Label>
                <Input
                  id="type_id"
                  type="number"
                  value={form.type_id}
                  onChange={(e) =>
                    setForm({ ...form, type_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="publish">Publish Status</Label>
                <Select
                  value={form.publish}
                  onValueChange={(val: string | null) => setForm({ ...form, publish: val || "public" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal_type">Goal Type</Label>
                <Select
                  value={form.goal_type}
                  onValueChange={(val: string | null) => setForm({ ...form, goal_type: val || "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visit">Visit</SelectItem>
                    <SelectItem value="signup">Signup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="num_visits">Goal Visits</Label>
                <Input
                  id="num_visits"
                  type="number"
                  value={form.num_visits}
                  onChange={(e) =>
                    setForm({ ...form, num_visits: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="num_signups">Goal Signups</Label>
              <Input
                id="num_signups"
                type="number"
                value={form.num_signups}
                onChange={(e) =>
                  setForm({ ...form, num_signups: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allow_email"
                checked={form.allow_email}
                onChange={(e) =>
                  setForm({ ...form, allow_email: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="allow_email">Allow Email Notifications</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/campaigns")}
              >
                Back to Campaigns
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

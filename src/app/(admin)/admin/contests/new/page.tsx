"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

export default function AdminNewContestPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    campaign_id: "",
    contest_name: "",
    contest_type_id: "",
    description: "",
    start_date: "",
    end_date: "",
    member_id: "",
    max_winners: "1",
    max_display: "10",
    is_on: false,
    winner_email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create contest");
      }

      toast.success("Contest created successfully");
      router.push("/admin/contests");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Add New Contest</h1>
      <p className="text-muted-foreground">Create a new campaign contest.</p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Contest Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contest_name">Contest Name</Label>
              <Input
                id="contest_name"
                value={form.contest_name}
                onChange={(e) =>
                  setForm({ ...form, contest_name: e.target.value })
                }
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
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
              <div className="flex-1">
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
            </div>
            <div>
              <Label htmlFor="contest_type_id">Contest Type ID</Label>
              <Input
                id="contest_type_id"
                type="number"
                value={form.contest_type_id}
                onChange={(e) =>
                  setForm({ ...form, contest_type_id: e.target.value })
                }
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
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="max_winners">Max Winners</Label>
                <Input
                  id="max_winners"
                  type="number"
                  value={form.max_winners}
                  onChange={(e) =>
                    setForm({ ...form, max_winners: e.target.value })
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="max_display">Max Display</Label>
                <Input
                  id="max_display"
                  type="number"
                  value={form.max_display}
                  onChange={(e) =>
                    setForm({ ...form, max_display: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="winner_email">Winner Email</Label>
              <Textarea
                id="winner_email"
                value={form.winner_email}
                onChange={(e) =>
                  setForm({ ...form, winner_email: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_on"
                checked={form.is_on}
                onChange={(e) => setForm({ ...form, is_on: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_on">Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Contest"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/contests")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

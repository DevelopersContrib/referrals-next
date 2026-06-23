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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Contest {
  id: number;
  campaign_id: number;
  contest_name: string;
  contest_type_id: number;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  member_id: number;
  max_winners: number | null;
  max_display: number | null;
  is_on: boolean | null;
  date_added: string;
  winner_email: string | null;
}

export default function AdminEditContestPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = use(params);
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetch(`/api/admin/contests/${contestId}`)
      .then((r) => r.json())
      .then((data: Contest) => {
        setContest(data);
        setForm({
          campaign_id: String(data.campaign_id ?? ""),
          contest_name: data.contest_name || "",
          contest_type_id: String(data.contest_type_id ?? ""),
          description: data.description || "",
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          member_id: String(data.member_id ?? ""),
          max_winners: String(data.max_winners ?? 1),
          max_display: String(data.max_display ?? 10),
          is_on: data.is_on || false,
          winner_email: data.winner_email || "",
        });
      })
      .catch(() => setError("Failed to load contest"))
      .finally(() => setLoading(false));
  }, [contestId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/contests/${contestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update contest");
      }

      toast.success("Contest updated successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this contest? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/contests/${contestId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Contest deleted");
      router.push("/admin/contests");
    } catch {
      setError("Failed to delete contest");
      toast.error("Failed to delete contest");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading contest...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Contest not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Edit Contest #{contest.id}
          </h1>
          <p className="text-muted-foreground">
            Created {new Date(contest.date_added).toLocaleDateString()}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Contest
        </Button>
      </div>

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
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/contests")}
              >
                Back to Contests
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
          <Badge variant="secondary">ID: {contest.id}</Badge>
          <Badge variant="secondary">Campaign: #{contest.campaign_id}</Badge>
          <Badge variant={contest.is_on ? "default" : "destructive"}>
            {contest.is_on ? "Active" : "Inactive"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

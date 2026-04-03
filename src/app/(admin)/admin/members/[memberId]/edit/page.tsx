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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Plan {
  id: number;
  name: string | null;
}

interface Member {
  id: number;
  name: string;
  email: string;
  plan_id: number | null;
  is_verified: boolean | null;
  is_partner: boolean | null;
  date_signedup: string;
  num_of_logins: number | null;
  signedup_social: string | null;
}

export default function AdminEditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    plan_id: "0",
    is_verified: false,
    is_partner: false,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/members/${memberId}`).then((r) => r.json()),
      fetch("/api/admin/plans").then((r) => r.json()),
    ])
      .then(([memberData, plansData]) => {
        setMember(memberData);
        setPlans(Array.isArray(plansData) ? plansData : []);
        setForm({
          name: memberData.name || "",
          email: memberData.email || "",
          password: "",
          plan_id: String(memberData.plan_id || 0),
          is_verified: memberData.is_verified || false,
          is_partner: memberData.is_partner || false,
        });
      })
      .catch(() => setError("Failed to load member"))
      .finally(() => setLoading(false));
  }, [memberId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        plan_id: form.plan_id,
        is_verified: form.is_verified,
        is_partner: form.is_partner,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }

      setSuccess("Member updated successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this member? This cannot be undone."))
      return;

    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/members");
    } catch {
      setError("Failed to delete member");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading member...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Member not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Member #{member.id}</h1>
          <p className="text-muted-foreground">
            Joined {new Date(member.date_signedup).toLocaleDateString()} |
            Logins: {member.num_of_logins || 0}
            {member.signedup_social && ` | Via: ${member.signedup_social}`}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Member
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
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
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="password">Reset Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={form.plan_id}
                onValueChange={(val: string | null) => setForm({ ...form, plan_id: val || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Free</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name || `Plan #${plan.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={form.is_verified}
                  onChange={(e) =>
                    setForm({ ...form, is_verified: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="is_verified">Email Verified</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_partner"
                  checked={form.is_partner}
                  onChange={(e) =>
                    setForm({ ...form, is_partner: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="is_partner">Partner</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/members")}
              >
                Back to Members
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
          <Badge variant="secondary">ID: {member.id}</Badge>
          <Badge variant="secondary">
            Plan: {plans.find((p) => p.id === member.plan_id)?.name || "Free"}
          </Badge>
          <Badge variant={member.is_verified ? "default" : "destructive"}>
            {member.is_verified ? "Verified" : "Unverified"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

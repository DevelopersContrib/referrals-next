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

export default function AdminNewSubdomainPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    url_id: "",
    created_by: "",
    subdomain: "",
    google_ua: "",
    header_script: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create subdomain");
      }

      toast.success("Subdomain created successfully");
      router.push("/admin/subdomains");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Add New Subdomain</h1>
      <p className="text-muted-foreground">
        Create a new whitelabel subdomain.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Subdomain Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={form.subdomain}
                onChange={(e) =>
                  setForm({ ...form, subdomain: e.target.value })
                }
                placeholder="brand.referrals.com"
              />
            </div>
            <div>
              <Label htmlFor="url_id">Brand ID</Label>
              <Input
                id="url_id"
                type="number"
                value={form.url_id}
                onChange={(e) => setForm({ ...form, url_id: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="created_by">Created By (Member ID)</Label>
              <Input
                id="created_by"
                type="number"
                value={form.created_by}
                onChange={(e) =>
                  setForm({ ...form, created_by: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="google_ua">Google UA</Label>
              <Input
                id="google_ua"
                value={form.google_ua}
                onChange={(e) =>
                  setForm({ ...form, google_ua: e.target.value })
                }
                placeholder="UA-XXXXXXXX-X"
              />
            </div>
            <div>
              <Label htmlFor="header_script">Header Script</Label>
              <Textarea
                id="header_script"
                value={form.header_script}
                onChange={(e) =>
                  setForm({ ...form, header_script: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Subdomain"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/subdomains")}
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

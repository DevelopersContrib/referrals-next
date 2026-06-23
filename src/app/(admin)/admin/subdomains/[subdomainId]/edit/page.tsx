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

interface Subdomain {
  id: number;
  url_id: number;
  created_by: number;
  subdomain: string | null;
  date_created: string;
  google_ua: string | null;
  header_script: string | null;
}

export default function AdminEditSubdomainPage({
  params,
}: {
  params: Promise<{ subdomainId: string }>;
}) {
  const { subdomainId } = use(params);
  const router = useRouter();
  const [subdomain, setSubdomain] = useState<Subdomain | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    url_id: "",
    created_by: "",
    subdomain: "",
    google_ua: "",
    header_script: "",
  });

  useEffect(() => {
    fetch(`/api/admin/subdomains/${subdomainId}`)
      .then((r) => r.json())
      .then((data: Subdomain) => {
        setSubdomain(data);
        setForm({
          url_id: String(data.url_id ?? ""),
          created_by: String(data.created_by ?? ""),
          subdomain: data.subdomain || "",
          google_ua: data.google_ua || "",
          header_script: data.header_script || "",
        });
      })
      .catch(() => setError("Failed to load subdomain"))
      .finally(() => setLoading(false));
  }, [subdomainId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/subdomains/${subdomainId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update subdomain");
      }

      toast.success("Subdomain updated successfully");
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
      !confirm(
        "Are you sure you want to delete this subdomain? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/subdomains/${subdomainId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Subdomain deleted");
      router.push("/admin/subdomains");
    } catch {
      setError("Failed to delete subdomain");
      toast.error("Failed to delete subdomain");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading subdomain...</p>
      </div>
    );
  }

  if (!subdomain) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Subdomain not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Edit Subdomain #{subdomain.id}
          </h1>
          <p className="text-muted-foreground">
            Created {new Date(subdomain.date_created).toLocaleDateString()}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Subdomain
        </Button>
      </div>

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
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/subdomains")}
              >
                Back to Subdomains
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
          <Badge variant="secondary">ID: {subdomain.id}</Badge>
          <Badge variant="secondary">Brand: #{subdomain.url_id}</Badge>
          <Badge variant="secondary">
            Created By: #{subdomain.created_by}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

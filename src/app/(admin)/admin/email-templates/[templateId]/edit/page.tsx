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

interface EmailTemplate {
  id: number;
  campaign_id: number;
  subject: string;
  template: string | null;
}

export default function AdminEditEmailTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(params);
  const router = useRouter();
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subject: "",
    template: "",
  });

  useEffect(() => {
    fetch(`/api/admin/email-templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) {
          toast.error(data.error);
          return;
        }
        setEmailTemplate(data);
        setForm({
          subject: data.subject || "",
          template: data.template || "",
        });
      })
      .catch(() => toast.error("Failed to load email template"))
      .finally(() => setLoading(false));
  }, [templateId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject,
          template: form.template,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update email template");
      }

      toast.success("Email template updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this email template? This cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Email template deleted");
      router.push("/admin/email-templates");
    } catch {
      toast.error("Failed to delete email template");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading email template...</p>
      </div>
    );
  }

  if (!emailTemplate) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Email template not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Edit Email Template #{emailTemplate.id}
          </h1>
          <p className="text-muted-foreground">
            Campaign #{emailTemplate.campaign_id}
          </p>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Template
        </Button>
      </div>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="template">Template Body</Label>
              <Textarea
                id="template"
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                rows={16}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/email-templates")}
              >
                Back to Email Templates
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

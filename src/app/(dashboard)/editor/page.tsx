"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EditorPage() {
  return (
    <Suspense>
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId") || "";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campaignId) return;

    setLoading(true);
    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setTitle(data.name);
        if (data.body_text || data.description) {
          setContent(data.body_text || data.description || "");
        }
      })
      .catch(() => {
        // New content
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  async function handleSave() {
    if (!campaignId) {
      setError("No campaign selected. Add ?campaignId=123 to the URL.");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          body_text: content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Editor</h1>
          <p className="mt-1 text-muted-foreground">
            Edit the content for your campaign landing page.
            {campaignId && (
              <span className="ml-1 font-medium">
                Campaign #{campaignId}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600">Changes saved!</span>
          )}
          <Button onClick={handleSave} disabled={saving || !campaignId}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!campaignId ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No campaign selected. Navigate to a campaign and click
              &quot;Edit Content&quot; to start editing.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading campaign content...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content Editor</CardTitle>
              <CardDescription>
                Edit your campaign page content using HTML or plain text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Campaign page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Page Content (HTML supported)</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<h2>Welcome to our referral program!</h2><p>Share with friends and earn rewards.</p>"
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Live preview of your campaign page content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white p-6">
                {title && (
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    {title}
                  </h2>
                )}
                {content ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <p className="text-gray-400">
                    Start typing to see a preview...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

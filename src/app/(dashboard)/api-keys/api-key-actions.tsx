"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ApiKeyActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setNewKey("");

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate API key.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setNewKey(data.api_key);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate New API Key"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {newKey && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-green-800">
              New API key generated. Copy it now &mdash; it will not be shown
              again in full.
            </p>
            <code className="mt-2 block break-all rounded bg-white p-2 text-sm font-mono">
              {newKey}
            </code>
          </CardContent>
        </Card>
      )}
    </>
  );
}

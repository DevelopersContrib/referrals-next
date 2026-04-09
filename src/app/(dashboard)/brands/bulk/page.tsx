"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ImportResult {
  url: string;
  status: "success" | "error";
  message: string;
}

export default function BulkBrandImportPage() {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    const lines = urls
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setLoading(false);
      return;
    }

    const importResults: ImportResult[] = [];

    for (const url of lines) {
      try {
        const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: normalizedUrl }),
        });

        if (res.ok) {
          importResults.push({
            url: normalizedUrl,
            status: "success",
            message: "Brand imported successfully",
          });
        } else {
          const data = await res.json();
          importResults.push({
            url: normalizedUrl,
            status: "error",
            message: data.error || "Failed to import",
          });
        }
      } catch {
        importResults.push({
          url,
          status: "error",
          message: "Network error",
        });
      }
    }

    setResults(importResults);
    setLoading(false);
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Bulk Brand Import</h1>
        <p className="mt-1 text-muted-foreground">
          Import multiple brands at once by pasting URLs, one per line.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Import Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                placeholder={"https://example.com\nhttps://another-site.com\nmy-brand.io"}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Enter one URL per line. URLs without http(s):// will have
                https:// prepended automatically.
              </p>
            </div>
            <Button type="submit" disabled={loading || !urls.trim()}>
              {loading ? "Importing..." : "Import Brands"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Import Results
              <Badge variant="default">{successCount} success</Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} failed</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border px-4 py-2"
                >
                  <span className="truncate text-sm font-mono">
                    {result.url}
                  </span>
                  <div className="ml-4 flex items-center gap-2">
                    <Badge
                      variant={
                        result.status === "success" ? "default" : "destructive"
                      }
                    >
                      {result.status}
                    </Badge>
                    {result.status === "error" && (
                      <span className="text-xs text-muted-foreground">
                        {result.message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

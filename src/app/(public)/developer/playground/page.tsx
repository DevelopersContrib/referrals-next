"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { cn } from "@/lib/utils";
import { PlayIcon, SendIcon } from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  label: string;
  body: boolean;
  defaultBody?: string;
}

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/v1/members/profile", label: "Get Profile", body: false },
  { method: "GET", path: "/api/v1/brands", label: "List Brands", body: false },
  {
    method: "POST",
    path: "/api/v1/brands",
    label: "Create Brand",
    body: true,
    defaultBody: '{\n  "url": "https://example.com",\n  "description": "My Brand"\n}',
  },
  { method: "GET", path: "/api/v1/campaigns", label: "List Campaigns", body: false },
  {
    method: "POST",
    path: "/api/v1/campaigns",
    label: "Create Campaign",
    body: true,
    defaultBody: '{\n  "name": "Summer Referral",\n  "url_id": 1\n}',
  },
  { method: "GET", path: "/api/v1/participants", label: "List Participants", body: false },
  {
    method: "POST",
    path: "/api/v1/signups",
    label: "Register Signup",
    body: true,
    defaultBody: '{\n  "campaign_id": 1,\n  "email": "user@example.com",\n  "name": "Jane Doe"\n}',
  },
  { method: "GET", path: "/api/v1/webhooks", label: "List Webhooks", body: false },
  { method: "GET", path: "/api/v1/billing/plans", label: "List Plans (Public)", body: false },
  { method: "GET", path: "/api/v1/lander?campaign_id=1", label: "Get Lander Config", body: false },
  {
    method: "POST",
    path: "/api/v1/auth/token",
    label: "Get Auth Token",
    body: true,
    defaultBody: '{\n  "email": "you@example.com",\n  "password": "your_password"\n}',
  },
];

const METHOD_STYLES: Record<string, string> = {
  GET: "border-emerald-200 bg-emerald-50 text-emerald-700",
  POST: "border-blue-200 bg-blue-50 text-blue-700",
  PUT: "border-amber-200 bg-amber-50 text-amber-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
};

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [body, setBody] = useState(ENDPOINTS[0].defaultBody || "");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = ENDPOINTS[selectedIdx];

  function handleSelect(idx: number) {
    setSelectedIdx(idx);
    setBody(ENDPOINTS[idx].defaultBody || "");
    setResponse("");
  }

  async function handleRun() {
    setLoading(true);
    setResponse("");
    try {
      const base =
        typeof window !== "undefined" ? window.location.origin : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["X-API-Key"] = apiKey;

      const opts: RequestInit = { method: selected.method, headers };
      if (selected.body && body.trim()) opts.body = body;

      const res = await fetch(`${base}${selected.path}`, opts);
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch (err) {
      setResponse(
        JSON.stringify(
          { error: err instanceof Error ? err.message : "Request failed" },
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">API Playground</h1>
        <p className="mt-1 text-muted-foreground">
          Test API endpoints live in your browser. Enter your API key and select
          an endpoint.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent>
              <Label htmlFor="api-key" className="mb-1.5">
                API Key
              </Label>
              <Input
                id="api-key"
                type="text"
                placeholder="ref_your_api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="-mt-2 space-y-0.5">
              {ENDPOINTS.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === selectedIdx
                      ? "bg-brand/10 font-medium text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 font-mono text-[10px]",
                      METHOD_STYLES[ep.method]
                    )}
                  >
                    {ep.method}
                  </Badge>
                  <span className="truncate">{ep.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="space-y-4">
          {/* URL Bar */}
          <Card>
            <CardContent className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 font-mono",
                  METHOD_STYLES[selected.method]
                )}
              >
                {selected.method}
              </Badge>
              <code className="min-w-0 flex-1 truncate font-mono text-sm">
                {selected.path}
              </code>
              <Button
                onClick={handleRun}
                disabled={loading}
                className="shrink-0 gap-2 bg-brand text-white hover:bg-brand-hover"
              >
                <SendIcon className="size-4" />
                {loading ? "Sending..." : "Send"}
              </Button>
            </CardContent>
          </Card>

          {/* Request Body */}
          {selected.body && (
            <Card>
              <CardHeader>
                <CardTitle>Request Body</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full min-h-[150px] resize-y rounded-lg border border-input bg-muted/30 p-4 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </CardContent>
            </Card>
          )}

          {/* Response */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Response</CardTitle>
              {response && <CopyToClipboardButton text={response} />}
            </CardHeader>
            <CardContent>
              {response ? (
                <pre className="max-h-[500px] overflow-auto rounded-lg bg-gray-900 p-4 font-mono text-sm leading-relaxed text-green-400">
                  {response}
                </pre>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed py-16">
                  <div className="text-center text-muted-foreground">
                    <PlayIcon className="mx-auto mb-2 size-8 opacity-50" />
                    <p className="text-sm">
                      Send a request to see the response
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

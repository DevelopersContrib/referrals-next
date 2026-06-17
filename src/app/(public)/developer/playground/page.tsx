"use client";

import { useState } from "react";
import { PlayIcon, CopyIcon, CheckIcon } from "lucide-react";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/members/profile", label: "Get Profile", body: false },
  { method: "GET", path: "/api/v1/brands", label: "List Brands", body: false },
  { method: "POST", path: "/api/v1/brands", label: "Create Brand", body: true, defaultBody: '{\n  "url": "https://example.com",\n  "description": "My Brand"\n}' },
  { method: "GET", path: "/api/v1/campaigns", label: "List Campaigns", body: false },
  { method: "POST", path: "/api/v1/campaigns", label: "Create Campaign", body: true, defaultBody: '{\n  "name": "Summer Referral",\n  "url_id": 1\n}' },
  { method: "GET", path: "/api/v1/participants", label: "List Participants", body: false },
  { method: "POST", path: "/api/v1/signups", label: "Register Signup", body: true, defaultBody: '{\n  "campaign_id": 1,\n  "email": "user@example.com",\n  "name": "Jane Doe"\n}' },
  { method: "GET", path: "/api/v1/webhooks", label: "List Webhooks", body: false },
  { method: "GET", path: "/api/v1/billing/plans", label: "List Plans (Public)", body: false },
  { method: "GET", path: "/api/v1/lander?campaign_id=1", label: "Get Lander Config", body: false },
  { method: "POST", path: "/api/v1/auth/token", label: "Get Auth Token", body: true, defaultBody: '{\n  "email": "you@example.com",\n  "password": "your_password"\n}' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PUT: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
};

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [body, setBody] = useState(ENDPOINTS[0].defaultBody || "");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

      const opts: RequestInit = {
        method: selected.method,
        headers,
      };
      if (selected.body && body.trim()) {
        opts.body = body;
      }

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

  function handleCopy() {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Playground</h1>
        <p className="mt-1 text-gray-600">
          Test API endpoints live. Enter your API key and select an endpoint to
          try.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              placeholder="ref_your_api_key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#FF5C62] focus:outline-none focus:ring-1 focus:ring-[#FF5C62]"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Endpoints
            </p>
            <div className="space-y-1">
              {ENDPOINTS.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    i === selectedIdx
                      ? "bg-[#FF5C62]/10 text-[#FF5C62] font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      METHOD_COLORS[ep.method]
                    }`}
                  >
                    {ep.method}
                  </span>
                  {ep.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="space-y-4">
          {/* URL Bar */}
          <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
            <span
              className={`rounded px-2 py-1 text-xs font-bold ${
                METHOD_COLORS[selected.method]
              }`}
            >
              {selected.method}
            </span>
            <code className="flex-1 text-sm text-gray-700">
              {selected.path}
            </code>
            <button
              onClick={handleRun}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5C62] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff4f58] disabled:opacity-50 transition"
            >
              <PlayIcon className="size-4" />
              {loading ? "Running..." : "Send"}
            </button>
          </div>

          {/* Request Body */}
          {selected.body && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">
                Request Body
              </p>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm focus:border-[#FF5C62] focus:outline-none focus:ring-1 focus:ring-[#FF5C62]"
              />
            </div>
          )}

          {/* Response */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Response</p>
              {response && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {copied ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <pre className="min-h-[200px] overflow-auto rounded-lg border bg-gray-900 p-4 text-sm text-green-400">
              {response || "// Response will appear here after you click Send"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

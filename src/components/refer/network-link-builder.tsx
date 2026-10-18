"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Loader2Icon, LinkIcon } from "lucide-react";
import { copyText } from "@/lib/clipboard";

/**
 * Mint a "refer another site" link: pick one of your brands (from) and the
 * network site you're linking to (to). Uses /api/domain-refer.
 */
export function NetworkLinkBuilder({ brands }: { brands: string[] }) {
  const [from, setFrom] = useState(brands[0] ?? "");
  const [to, setTo] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to.trim()) return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch(
        `/api/domain-refer?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.trim())}`,
        { cache: "no-store" }
      );
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setState("error");
        setMessage(data.error || "That site isn't in the network yet. Try another one.");
        return;
      }
      setUrl(data.url);
      setState("done");
    } catch {
      setState("error");
      setMessage("Couldn't create the link. Please try again.");
    }
  }

  if (brands.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Add a brand first. Network links are credited to one of your brands.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={build} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-600">Your brand</span>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-600">Site you&apos;re linking to</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g. homerepair.net"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={state === "loading" || !to.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-4 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LinkIcon className="size-4" aria-hidden="true" />
          )}
          Get my link
        </button>
      </form>

      {state === "error" && <p className="text-sm text-amber-800">{message}</p>}

      {state === "done" && url && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-xs text-violet-950">{url}</code>
          <button
            type="button"
            onClick={async () => {
              if (await copyText(url)) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-3 text-xs font-semibold text-violet-900 shadow-sm"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

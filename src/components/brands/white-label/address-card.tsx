"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";

type Status = {
  live: boolean;
  records: { type: string; name: string; value: string }[];
  note: string | null;
} | null;

type Props = {
  kind: "subdomain" | "custom";
  brandId: number;
  initial: string | null;
  disabled: boolean;
  color: string;
};

const ROOT = "referrals.com";

/**
 * Connect a white-label address: {name}.referrals.com or the owner's own
 * domain. Shows whether it's live and, for custom domains, the DNS record to add.
 */
export function AddressCard({ kind, brandId, initial, disabled, color }: Props) {
  const endpoint = `/api/brands/${brandId}/${kind === "subdomain" ? "subdomain" : "custom-domain"}`;
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(Boolean(initial));
  const [error, setError] = useState("");

  const address = saved ? (kind === "subdomain" ? `${saved}.${ROOT}` : saved) : null;

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setStatus(data.status ?? null);
    } catch {
      /* keep the last status */
    }
    setChecking(false);
  }, [endpoint]);

  useEffect(() => {
    if (!initial) return;
    let cancelled = false;
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.status ?? null);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, initial]);

  // While a new address is settling, look again every 20 seconds.
  useEffect(() => {
    if (!address || status?.live || !status) return;
    const t = setInterval(check, 20_000);
    return () => clearInterval(t);
  }, [address, status, check]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "subdomain" ? { subdomain: value } : { domain: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save that. Try again.");
      } else {
        const next = kind === "subdomain" ? (data.subdomain?.subdomain ?? value) : (data.domain ?? value);
        setSaved(next);
        setValue(next);
        setStatus(data.status ?? null);
      }
    } catch {
      setError("Couldn't save that. Check your connection and try again.");
    }
    setBusy(false);
  }

  async function remove() {
    if (!address || !confirm(`Disconnect ${address}? Links using it will stop working.`)) return;
    setBusy(true);
    setError("");
    const res = await fetch(endpoint, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setSaved(null);
      setValue("");
      setStatus(null);
    } else {
      setError("Couldn't disconnect it. Try again.");
    }
    setBusy(false);
  }

  const inputId = `wl-${kind}`;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <form onSubmit={save} className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
          {kind === "subdomain" ? "Your referrals.com address" : "Your own domain"}
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/20">
            <input
              id={inputId}
              value={value}
              disabled={disabled || busy}
              onChange={(e) =>
                setValue(
                  kind === "subdomain"
                    ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    : e.target.value.toLowerCase().replace(/\s/g, ""),
                )
              }
              placeholder={kind === "subdomain" ? "yourbrand" : "refer.yoursite.com"}
              autoComplete="off"
              spellCheck={false}
              className="min-h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
            />
            {kind === "subdomain" && <span className="shrink-0 pr-3 text-sm text-gray-400">.{ROOT}</span>}
          </div>
          <button
            type="submit"
            disabled={disabled || busy || value.length < 3 || value === saved}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {busy && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
            {saved ? "Change" : "Connect"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {address && (
        <div className="mt-3 space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            {checking && !status ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Loader2Icon className="size-4 animate-spin" aria-hidden="true" /> Checking {address}…
              </span>
            ) : status?.live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2Icon className="size-4" aria-hidden="true" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
                <span className="size-2 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" aria-hidden="true" />
                Not live yet
              </span>
            )}
            <a
              href={`https://${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color }}
            >
              {address} <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            </a>
            <span className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={check}
                disabled={checking}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              >
                <RefreshCwIcon className={`size-3.5 ${checking ? "animate-spin" : ""}`} aria-hidden="true" />
                Check again
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2Icon className="size-3.5" aria-hidden="true" />
                Disconnect
              </button>
            </span>
          </div>

          {status && !status.live && status.note && <p className="text-sm text-gray-600">{status.note}</p>}

          {status && !status.live && status.records.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Type</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Name</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {status.records.map((r) => (
                    <tr key={`${r.type}-${r.name}-${r.value}`}>
                      <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.name}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1">
                          <code className="break-all font-mono text-xs">{r.value}</code>
                          <CopyToClipboardButton text={r.value} aria-label={`Copy ${r.type} value`} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

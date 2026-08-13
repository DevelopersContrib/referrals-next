"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LifeBuoy, Mail, Clock, User, Search } from "lucide-react";

type Ticket = {
  id: number;
  public_id: string;
  requester_name: string | null;
  requester_email: string | null;
  subject: string;
  status: string;
  source: string;
  ai_handling: boolean;
  last_message_at: string;
};

const STATUS_FILTERS = new Set([
  "open",
  "waiting_on_staff",
  "waiting_on_contractor",
  "resolved",
  "closed",
]);

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(() => {
    const fromUrl = searchParams.get("status") || "";
    return STATUS_FILTERS.has(fromUrl) ? fromUrl : "";
  });
  const [source, setSource] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (q.trim()) params.set("q", q.trim());
    try {
      const r = await fetch(`/api/admin/support/tickets?${params}`);
      const data = await r.json();
      if (data.error) setError(data.error);
      else setTickets(data.tickets || []);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  // Dashboard deep-links (?status=…) — only react when the URL changes
  useEffect(() => {
    const fromUrl = searchParams.get("status") || "";
    setStatus(STATUS_FILTERS.has(fromUrl) ? fromUrl : "");
  }, [searchParams]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [status, source]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LifeBuoy className="h-7 w-7 text-[#ff646c]" />
          Support
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          AI-first contact + inbound email · <code className="text-gray-500">site=referrals</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[140px]">
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#292A2D] text-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="waiting_on_staff">Waiting on staff</option>
            <option value="waiting_on_contractor">Waiting on customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs text-gray-500 block mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#292A2D] text-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="contact_form">Contact form</option>
            <option value="inbound_email">Inbound email</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="RF-1234, email, subject…"
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 rounded-lg border border-white/10 bg-[#292A2D] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 rounded-lg bg-[#ff646c] text-white hover:bg-[#ff4f58]"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && tickets.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#292A2D] p-6 text-gray-400">
          No tickets yet. Submit the contact form or email support@referrals.com.
        </div>
      )}

      <div className="grid gap-4">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/admin/support/${t.id}`}
            className="block rounded-xl border border-white/10 bg-[#292A2D] p-5 hover:border-[#ff646c]/40 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-[#ff646c]">{t.public_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300">{t.status}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">{t.source}</span>
                  {t.ai_handling && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#926efb]/20 text-[#926efb]">AI</span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-white mt-2">{t.subject}</h2>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(t.last_message_at).toLocaleString()}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {t.requester_name || "Guest"}
              </span>
              {t.requester_email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {t.requester_email}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

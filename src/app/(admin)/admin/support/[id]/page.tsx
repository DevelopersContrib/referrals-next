"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, CheckCircle, Sparkles } from "lucide-react";

type Message = {
  id: number;
  author_type: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

type Ticket = {
  id: number;
  public_id: string;
  subject: string;
  status: string;
  source: string;
  ai_handling: boolean;
  requester_name: string | null;
  requester_email: string | null;
  messages: Message[];
};

export default function AdminSupportTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [internalNote, setInternalNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/support/tickets/${id}`);
      const data = await r.json();
      if (data.error) setError(data.error);
      else setTicket(data.ticket);
    } catch {
      setError("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/support/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply, is_internal: internalNote }),
      });
      const data = await r.json();
      if (data.error) setError(data.error);
      else {
        setReply("");
        setTips([]);
        setTicket(data.ticket);
      }
    } catch {
      setError("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function aiDraft() {
    setDrafting(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/support/tickets/${id}/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (data.error) setError(data.error);
      else {
        if (data.draft) setReply(data.draft);
        setTips(data.tips || []);
      }
    } catch {
      setError("AI draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function setStatus(status: string) {
    const r = await fetch(`/api/admin/support/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await r.json();
    if (data.ticket) setTicket(data.ticket);
  }

  if (loading) return <p className="p-6 text-gray-400">Loading…</p>;
  if (!ticket) return <p className="p-6 text-red-400">{error || "Ticket not found"}</p>;

  return (
    <div className="space-y-6 max-w-3xl p-6">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#ff646c]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[#ff646c]">{ticket.public_id}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300">{ticket.status}</span>
            {ticket.ai_handling && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#926efb]/20 text-[#926efb]">AI active</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mt-2">{ticket.subject}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {ticket.requester_name || "Guest"}
            {ticket.requester_email ? ` · ${ticket.requester_email}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={ticket.status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#292A2D] text-gray-200 px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="waiting_on_staff">Waiting on staff</option>
            <option value="waiting_on_contractor">Waiting on customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="button"
            onClick={() => setStatus("resolved")}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-200 hover:bg-white/5"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border p-4 ${
              m.is_internal
                ? "border-amber-900/40 bg-amber-950/20"
                : m.author_type === "staff" || m.author_type === "agent"
                  ? "border-white/10 bg-[#292A2D]"
                  : "border-white/5 bg-[#212529]"
            }`}
          >
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>
                {m.author_type}
                {m.is_internal ? " · internal" : ""}
              </span>
              <span>{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#292A2D] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={internalNote}
              onChange={(e) => setInternalNote(e.target.checked)}
            />
            Internal note only
          </label>
          {!internalNote && (
            <button
              type="button"
              onClick={aiDraft}
              disabled={drafting}
              className="inline-flex items-center gap-1 text-sm text-[#926efb] hover:underline disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {drafting ? "Drafting…" : "AI draft reply"}
            </button>
          )}
        </div>
        {tips.length > 0 && (
          <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={internalNote ? "Internal note…" : "Reply to customer…"}
          rows={6}
          className="w-full rounded-lg border border-white/10 bg-[#212529] px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={sendReply}
          disabled={sending || !reply.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff646c] text-white text-sm font-medium disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {internalNote ? "Add note" : "Send reply"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}

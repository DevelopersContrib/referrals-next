"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Message = {
  id: number;
  author_type: string;
  body: string;
  created_at: string | Date;
};

type Props = {
  publicId: string;
  status: string;
  aiHandling: boolean;
  messages: Message[];
};

function authorLabel(type: string): string {
  if (type === "customer" || type === "email" || type === "contractor") return "You";
  if (type === "agent") return "Support Assistant";
  if (type === "staff") return "Referrals Support";
  return "System";
}

function isYou(type: string): boolean {
  return type === "customer" || type === "email" || type === "contractor";
}

export default function SupportTicketThread({
  publicId,
  status,
  aiHandling,
  messages,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(action?: "resolve" | "escalate", message?: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/member/support/tickets/${publicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action ? { action } : { body: message ?? body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const closed = status === "closed" || status === "resolved";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl border px-4 py-3 ${
              isYou(m.author_type)
                ? "border-[#ebeef0] bg-white"
                : m.author_type === "agent"
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-brand/20 bg-brand/5"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#a7abc3]">
                {authorLabel(m.author_type)}
              </p>
              <time className="text-[11px] text-[#a7abc3]" suppressHydrationWarning>
                {new Date(m.created_at).toLocaleString("en-US")}
              </time>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#575962]">
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {!closed ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void post("resolve")}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
          >
            This solved it
          </button>
          {aiHandling ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void post("escalate")}
              className="rounded-lg border border-[#ebeef0] bg-white px-3 py-2 text-xs font-bold text-[#575962] hover:bg-[#f7f8fa] disabled:opacity-60"
            >
              Still need help
            </button>
          ) : null}
        </div>
      ) : null}

      {!closed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void post(undefined, body);
          }}
          className="rounded-2xl border border-[#ebeef0] bg-white p-4 shadow-sm"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            placeholder="Reply…"
            className="w-full rounded-lg border border-[#ebeef0] px-3 py-2 text-sm text-[#575962] outline-none focus:border-brand"
          />
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reply"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[#a7abc3]">This ticket is {status.replace(/_/g, " ")}.</p>
      )}
    </div>
  );
}

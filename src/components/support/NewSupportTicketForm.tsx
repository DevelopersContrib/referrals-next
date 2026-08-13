"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUPPORT_CATEGORIES } from "@/lib/support-types";

export default function NewSupportTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/member/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, category, priority }),
      });
      const data = (await res.json()) as {
        error?: string;
        ticket?: { public_id: string };
      };
      if (!res.ok || !data.ticket) throw new Error(data.error || "Could not create ticket");
      router.push(`/dashboard/support/${data.ticket.public_id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-[#ebeef0] bg-white p-5 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#a7abc3]">
          Subject
        </label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-[#ebeef0] px-3 py-2 text-sm text-[#575962] outline-none focus:border-brand"
          placeholder="Short summary"
          maxLength={200}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#a7abc3]">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-[#ebeef0] px-3 py-2 text-sm capitalize text-[#575962] outline-none focus:border-brand"
          >
            {SUPPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#a7abc3]">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-[#ebeef0] px-3 py-2 text-sm text-[#575962] outline-none focus:border-brand"
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#a7abc3]">
          Message
        </label>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-[#ebeef0] px-3 py-2 text-sm text-[#575962] outline-none focus:border-brand"
          placeholder="Describe your question or problem…"
          maxLength={8000}
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Submit ticket"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

/**
 * Opt in to the weekly digest. Flips optimistically and rolls back on failure,
 * since a checkbox that lags behind the click reads as broken.
 */
export function DigestToggle({ enabled: initial }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle(next: boolean) {
    setEnabled(next);
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/forum/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        setEnabled(!next);
        setError("Could not save that. Try again.");
      }
    } catch {
      setEnabled(!next);
      setError("Could not save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="size-4 shrink-0 rounded border-gray-300 accent-[#D63A40]"
        />
        <span className="text-gray-700">
          Email me a weekly digest of new topics
        </span>
      </label>
      {error ? (
        <p role="status" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

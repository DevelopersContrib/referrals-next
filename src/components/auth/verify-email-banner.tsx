"use client";

import { useState } from "react";
import { MailIcon } from "lucide-react";

/**
 * Shown to signed-in members who haven't confirmed their email yet.
 * Not a wall: they can keep setting up; publishing needs a verified email.
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function resend() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data.error || "Couldn't send the email. Please try again.");
        return;
      }
      setState("sent");
      setMessage(
        data.alreadyVerified
          ? "Your email is already confirmed. Refresh the page."
          : `Sent. Check ${email} (and your spam folder).`
      );
    } catch {
      setState("error");
      setMessage("Couldn't send the email. Please try again.");
    }
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2">
        <MailIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Confirm your email: we sent a link to <strong>{email}</strong>. You can keep
          setting up; you&apos;ll need it confirmed before you publish.
          {message && <span className="block pt-1 font-medium">{message}</span>}
        </span>
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={state === "sending" || state === "sent"}
        className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "Sent" : "Resend email"}
      </button>
    </div>
  );
}

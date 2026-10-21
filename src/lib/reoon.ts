import { prisma } from "@/lib/prisma";

/**
 * Reoon email verification (emailverifier.reoon.com), used to keep fake and
 * throwaway addresses out of sign-up. Same API and verdict rules as
 * newsletter.org's lib/reoon.ts, but "quick" mode so sign-up stays fast.
 *
 * Off until REOON_API_KEY is set. Reoon being slow or down never blocks a
 * sign-up: the check fails open.
 */
const REOON_BASE = "https://emailverifier.reoon.com/api/v1";
const TIMEOUT_MS = 6_000;

export type EmailVerdict = "allow" | "risky" | "block";

export type EmailCheck = {
  verdict: EmailVerdict;
  status: string;
  isDisposable: boolean | null;
  score: number | null;
};

export function reoonEnabled(): boolean {
  return Boolean((process.env.REOON_API_KEY || "").trim());
}

/** Map a Reoon result to allow, risky or block. */
export function verdictFor(status: string, raw: Record<string, unknown>): EmailVerdict {
  const s = status.toLowerCase();
  if (raw.is_spamtrap === true || s === "spamtrap") return "block";
  if (s === "invalid" || s === "disposable" || s === "disabled") return "block";
  if (raw.is_disposable === true) return "block";
  if (s === "safe" || s === "valid" || raw.is_safe_to_send === true || raw.is_deliverable === true) {
    return "allow";
  }
  return "risky"; // catch_all, unknown, inbox_full, role accounts and anything new
}

/** Check one address. Returns null when Reoon is off or didn't answer in time. */
export async function checkEmail(email: string): Promise<EmailCheck | null> {
  const key = (process.env.REOON_API_KEY || "").trim();
  if (!key) return null;
  const url = new URL(`${REOON_BASE}/verify`);
  url.searchParams.set("email", email);
  url.searchParams.set("key", key);
  url.searchParams.set("mode", "quick");
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      console.warn("[reoon] check failed:", res.status, String(raw.message || raw.error || ""));
      return null;
    }
    const status = String(raw.status || "unknown");
    return {
      verdict: verdictFor(status, raw),
      status,
      isDisposable: typeof raw.is_disposable === "boolean" ? raw.is_disposable : null,
      score: typeof raw.overall_score === "number" ? raw.overall_score : null,
    };
  } catch (error) {
    console.warn("[reoon] check error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Save a check for the admin Sign-ups report. Never throws. */
export async function recordEmailCheck(entry: {
  email: string;
  memberId: number | null;
  check: EmailCheck;
  source: "signup" | "backfill";
}) {
  try {
    await prisma.member_email_checks.create({
      data: {
        member_id: entry.memberId,
        email: entry.email.slice(0, 200),
        status: entry.check.status.slice(0, 32),
        verdict: entry.check.verdict,
        is_disposable: entry.check.isDisposable,
        score: entry.check.score,
        source: entry.source,
      },
    });
  } catch (error) {
    console.warn("[reoon] could not save check:", error instanceof Error ? error.message.split("\n")[0] : error);
  }
}

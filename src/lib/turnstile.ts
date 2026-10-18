/**
 * Cloudflare Turnstile for the email + password sign-up form.
 *
 * Production needs NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY. When
 * either is missing in production the check is off (never lock everyone out
 * because one variable is unset). In development Cloudflare's always-pass
 * test keys are used so the widget shows up locally.
 */
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";
const isDev = process.env.NODE_ENV !== "production";

function siteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || (isDev ? TEST_SITE_KEY : null);
}

function secretKey(): string | null {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || (isDev ? TEST_SECRET_KEY : null);
}

export function turnstileEnabled(): boolean {
  return Boolean(siteKey() && secretKey());
}

/** Verify a widget token with Cloudflare. True when Turnstile is off. */
export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const body = new URLSearchParams({ secret: secretKey()!, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[turnstile] verify failed:", error);
    return false;
  }
}

/** Client IP for siteverify, from the usual proxy headers. */
export function requestIp(headers: Headers): string | null {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

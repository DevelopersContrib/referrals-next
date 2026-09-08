import { timingSafeEqual } from "crypto";

export function networkKeyMatches(
  provided: string | null,
  expected: string | undefined,
) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** NETWORK_WRITE_KEY, or NETWORK_READ_KEY when ops uses one shared secret. */
export function authenticateNetworkWriteKey(apiKey: string | null): boolean {
  const writeKey = process.env.NETWORK_WRITE_KEY;
  const readKey = process.env.NETWORK_READ_KEY;
  if (!writeKey && !readKey) return false;
  if (writeKey && networkKeyMatches(apiKey, writeKey)) return true;
  if (readKey && networkKeyMatches(apiKey, readKey)) return true;
  return false;
}

export function networkWriteKeyConfigured(): boolean {
  return Boolean(process.env.NETWORK_WRITE_KEY || process.env.NETWORK_READ_KEY);
}

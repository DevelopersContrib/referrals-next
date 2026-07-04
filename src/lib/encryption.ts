import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

// Legacy key that was hardcoded in source. Share links generated before a
// proper WIDGET_ENCRYPTION_KEY was configured were encrypted with this, so we
// must keep it available for decryption (backward compatibility).
const LEGACY_KEY = "referrals-default-encryption-key-32b";

// Active key used for all NEW encryption. Set WIDGET_ENCRYPTION_KEY in the
// environment to rotate to a strong secret.
const PRIMARY_KEY = process.env.WIDGET_ENCRYPTION_KEY || LEGACY_KEY;

// Derive scrypt keys once (scryptSync is intentionally expensive). Decryption
// tries the primary key first, then the legacy key so in-flight links from
// before rotation still resolve. Once the primary === legacy (no env set),
// there's only one distinct key to try.
const PRIMARY_DERIVED = crypto.scryptSync(PRIMARY_KEY, "salt", 32);
const DECRYPT_KEYS =
  PRIMARY_KEY === LEGACY_KEY
    ? [PRIMARY_DERIVED]
    : [PRIMARY_DERIVED, crypto.scryptSync(LEGACY_KEY, "salt", 32)];

/**
 * Encrypt a share code for widget tracking.
 * Format: campaignId:socialType:participantId[:invitedEmailId]
 * Preserves backward compatibility with existing PHP AES-256-CBC encryption.
 */
export function encryptShareCode(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, PRIMARY_DERIVED, iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Combine IV + encrypted data, URL-safe base64
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
  return combined.toString("base64url");
}

/**
 * Decrypt a share code back to its components.
 *
 * Tries the active key first, then the legacy key, so links created before a
 * key rotation continue to work. Throws only if no configured key can decode.
 */
export function decryptShareCode(encoded: string): string {
  const combined = Buffer.from(encoded, "base64url");
  const iv = combined.subarray(0, 16);
  const encrypted = combined.subarray(16);

  let lastError: unknown;
  for (const key of DECRYPT_KEYS) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString("utf8");
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to decrypt share code");
}

/**
 * Parse a decrypted share code into its components.
 */
export function parseShareCode(decrypted: string) {
  const parts = decrypted.split(":");
  return {
    campaignId: parseInt(parts[0], 10),
    socialType: parts[1],
    participantId: parseInt(parts[2], 10),
    invitedEmailId: parts[3] ? parseInt(parts[3], 10) : undefined,
  };
}

/**
 * Generate a simple unique share code for a participant.
 */
export function generateShareCode(): string {
  return crypto.randomBytes(8).toString("base64url");
}

import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY = process.env.WIDGET_ENCRYPTION_KEY || "referrals-default-encryption-key-32b";

/**
 * Encrypt a share code for widget tracking.
 * Format: campaignId:socialType:participantId[:invitedEmailId]
 * Preserves backward compatibility with existing PHP AES-256-CBC encryption.
 */
export function encryptShareCode(data: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Combine IV + encrypted data, URL-safe base64
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
  return combined.toString("base64url");
}

/**
 * Decrypt a share code back to its components.
 */
export function decryptShareCode(encoded: string): string {
  const combined = Buffer.from(encoded, "base64url");
  const iv = combined.subarray(0, 16);
  const encrypted = combined.subarray(16);

  const key = crypto.scryptSync(KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
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

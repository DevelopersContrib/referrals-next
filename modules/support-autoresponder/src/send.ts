import { buildAutoresponderBodies, buildAutoresponderSubject } from "./templates";
import type {
  AutoresponderResult,
  SendEmailFn,
  SupportAutoresponderConfig,
  SupportAutoresponderInput,
} from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Send a support autoresponder. Never throws — returns a result for logging.
 * Best-effort: call with `void sendSupportAutoresponder(...)` from contact handlers.
 */
export async function sendSupportAutoresponder(
  config: SupportAutoresponderConfig,
  input: SupportAutoresponderInput,
  sendEmail: SendEmailFn
): Promise<AutoresponderResult> {
  if (config.enabled === false) {
    return { ok: true, skipped: true, reason: "disabled" };
  }

  const email = input.email.trim();
  const name = input.name.trim();
  const subject = input.subject.trim();
  if (!name || !email || !subject) {
    return { ok: true, skipped: true, reason: "missing_fields" };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: true, skipped: true, reason: "invalid_email" };
  }
  if (!config.fromEmail?.trim() || !config.siteName?.trim()) {
    return { ok: true, skipped: true, reason: "missing_config" };
  }

  const bodies = buildAutoresponderBodies(config, {
    ...input,
    name,
    email,
    subject,
  });
  const mailSubject = buildAutoresponderSubject(config, {
    ...input,
    name,
    email,
    subject,
  });

  try {
    await sendEmail({
      from: config.fromEmail.trim(),
      to: email,
      replyTo: (config.replyToEmail || config.supportEmail || config.fromEmail).trim(),
      subject: mailSubject,
      text: bodies.text,
      html: bodies.html,
    });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[support-autoresponder]", config.siteName, error);
    return { ok: false, error };
  }
}

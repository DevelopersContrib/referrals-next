import type { SupportAutoresponderConfig, SupportAutoresponderInput } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? "");
}

export function buildAutoresponderSubject(
  config: SupportAutoresponderConfig,
  input: SupportAutoresponderInput
): string {
  const template =
    config.subjectTemplate || "We received your message — {siteName}";
  return applyTokens(template, {
    siteName: config.siteName,
    subject: input.subject,
    name: input.name,
  });
}

export function buildAutoresponderBodies(
  config: SupportAutoresponderConfig,
  input: SupportAutoresponderInput
): { text: string; html: string } {
  const support = config.supportEmail || config.replyToEmail || config.fromEmail;
  const siteUrl = config.siteUrl.replace(/\/$/, "");
  const first = input.name.split(/\s+/)[0] || input.name;

  const text = [
    `Hi ${first},`,
    "",
    `Thanks for contacting ${config.siteName}. We received your message and our support team will get back to you soon.`,
    "",
    `Your subject: ${input.subject}`,
    "",
    "— What happens next —",
    "• We review your note and reply by email",
    "• Keep this thread for follow-ups when possible",
    `• Urgent? Email ${support}`,
    "",
    input.reference ? `Reference: ${input.reference}` : null,
    "",
    `— The ${config.siteName} team`,
    siteUrl,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f4f1;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4f1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #e8e4de;border-radius:8px;padding:28px 32px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#c41e2a;font-family:system-ui,sans-serif;">${escapeHtml(config.siteName)}</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:normal;line-height:1.3;">We received your message</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Hi ${escapeHtml(first)},</p>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Thanks for contacting ${escapeHtml(config.siteName)}. Our support team will get back to you soon.</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#444;"><strong>Your subject:</strong> ${escapeHtml(input.subject)}</p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#555;">What happens next</p>
          <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.55;color:#333;">
            <li>We review your note and reply by email</li>
            <li>Keep this thread for follow-ups when possible</li>
            <li>Urgent? Email <a href="mailto:${escapeHtml(support)}" style="color:#c41e2a;">${escapeHtml(support)}</a></li>
          </ul>
          ${
            input.reference
              ? `<p style="margin:0 0 16px;font-size:13px;color:#777;">Reference: ${escapeHtml(input.reference)}</p>`
              : ""
          }
          <p style="margin:0;font-size:14px;color:#555;">— The ${escapeHtml(config.siteName)} team<br>
          <a href="${escapeHtml(siteUrl)}" style="color:#c41e2a;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { text, html };
}

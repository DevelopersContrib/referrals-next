import type { MailProvider } from "./types";

/**
 * Active outbound provider. Set EMAIL_PROVIDER=ses|resend explicitly, or:
 * - defaults to `resend` when RESEND_API_KEY is set
 * - otherwise `ses`
 */
export function emailProvider(): MailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (explicit === "resend" || explicit === "ses") return explicit;
  return process.env.RESEND_API_KEY ? "resend" : "ses";
}

/** Whether the active provider has credentials to send. */
export function emailConfigured(): boolean {
  if (emailProvider() === "resend") {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  }
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      (process.env.SES_REGION || process.env.AWS_SES_REGION || process.env.AWS_REGION)
  );
}

export function sesRegion(): string {
  return (
    process.env.SES_REGION ||
    process.env.AWS_SES_REGION ||
    process.env.AWS_REGION ||
    "us-east-1"
  );
}

export function defaultFromEmail(fallback = "noreply@example.com"): string {
  return (
    process.env.SES_FROM_EMAIL?.trim() ||
    process.env.SUPPORT_FROM_EMAIL?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    fallback
  );
}

function formatFrom(from: string, fromName?: string): string {
  return fromName ? `${fromName} <${from}>` : from;
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}

function buildRawMime(args: {
  from: string;
  fromName?: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
  listUnsubscribeUrl?: string;
}): Uint8Array {
  const source = formatFrom(args.from, args.fromName);
  const boundary = `_contrib_${Date.now()}`;
  const lines: string[] = [`From: ${source}`, `To: ${args.to}`];
  if (args.replyTo) lines.push(`Reply-To: ${args.replyTo}`);
  if (args.listUnsubscribeUrl) {
    lines.push(`List-Unsubscribe: <${args.listUnsubscribeUrl}>`);
    lines.push("List-Unsubscribe-Post: List-Unsubscribe=One-Click");
  }
  lines.push(`Subject: ${encodeSubject(args.subject)}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("");
  lines.push(args.text);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("");
  lines.push(args.html);
  lines.push("");
  lines.push(`--${boundary}--`);
  lines.push("");
  return Buffer.from(lines.join("\r\n"), "utf8");
}

export type SesSendOpts = {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export async function sendViaSes(
  args: import("./types").AppSendEmailArgs,
  opts: SesSendOpts = {}
): Promise<void> {
  const region = opts.region || sesRegion();
  const accessKeyId = opts.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = opts.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "";
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "SES missing region or AWS credentials (SES_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)."
    );
  }

  const { SESClient, SendEmailCommand, SendRawEmailCommand } = await import("@aws-sdk/client-ses");
  const ses = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });
  const source = formatFrom(args.from, args.fromName);
  const html = args.html || args.text.replace(/\n/g, "<br>");

  if (args.listUnsubscribeUrl) {
    const raw = buildRawMime({ ...args, html });
    await ses.send(
      new SendRawEmailCommand({
        Source: source,
        Destinations: [args.to],
        RawMessage: { Data: raw },
      })
    );
    return;
  }

  await ses.send(
    new SendEmailCommand({
      Source: source,
      Destination: { ToAddresses: [args.to] },
      ReplyToAddresses: args.replyTo ? [args.replyTo] : undefined,
      Message: {
        Subject: { Data: args.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: args.text, Charset: "UTF-8" },
        },
      },
    })
  );
}

export async function sendViaResend(
  args: import("./types").AppSendEmailArgs,
  opts: { apiKey?: string } = {}
): Promise<void> {
  const apiKey = opts.apiKey || process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    throw new Error("Resend missing RESEND_API_KEY.");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const from = formatFrom(args.from, args.fromName);
  const html = args.html || args.text.replace(/\n/g, "<br>");
  const headers: Record<string, string> = {};
  if (args.listUnsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${args.listUnsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const { error } = await resend.emails.send({
    from,
    to: [args.to],
    subject: args.subject,
    html,
    text: args.text,
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

import type { SendEmailArgs, SendEmailFn } from "./types";

export type SesAdapterOptions = {
  region?: string;
};

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}

function buildRawMime(args: SendEmailArgs & { extraHeaders: Record<string, string> }): Uint8Array {
  const source = args.fromName ? `${args.fromName} <${args.from}>` : args.from;
  const boundary = `_handyman_${Date.now()}`;
  const lines: string[] = [
    `From: ${source}`,
    `To: ${args.to}`,
  ];
  if (args.replyTo) lines.push(`Reply-To: ${args.replyTo}`);
  for (const [key, value] of Object.entries(args.extraHeaders)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push(`Subject: ${encodeSubject(args.subject)}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(args.text);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(args.html);
  lines.push("");
  lines.push(`--${boundary}--`);
  lines.push("");
  return Buffer.from(lines.join("\r\n"), "utf8");
}

export function createSesSendEmail(opts: SesAdapterOptions = {}): SendEmailFn {
  return async (args: SendEmailArgs) => {
    const region = opts.region || process.env.AWS_SES_REGION || process.env.AWS_REGION;
    if (!region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "SES engagement missing region or AWS credentials (AWS_SES_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)."
      );
    }
    const { SESClient, SendEmailCommand, SendRawEmailCommand } = await import("@aws-sdk/client-ses");
    const ses = new SESClient({ region });
    const source = args.fromName ? `${args.fromName} <${args.from}>` : args.from;

    if (args.listUnsubscribeUrl) {
      const raw = buildRawMime({
        ...args,
        extraHeaders: {
          "List-Unsubscribe": `<${args.listUnsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
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
            Html: { Data: args.html, Charset: "UTF-8" },
            Text: { Data: args.text, Charset: "UTF-8" },
          },
        },
      })
    );
  };
}

import type { SendEmailArgs, SendEmailFn } from "./types";

export type SesAdapterOptions = {
  /** SES region. Falls back to AWS_SES_REGION || AWS_REGION. */
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

/**
 * Optional AWS SES send adapter. Peer-dep on `@aws-sdk/client-ses`.
 * Domains without SES can pass their own `sendEmail` instead.
 */
export function createSesSendEmail(opts: SesAdapterOptions = {}): SendEmailFn {
  const region =
    opts.region || process.env.AWS_SES_REGION || process.env.AWS_REGION || "";
  const accessKeyId = opts.accessKeyId || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey =
    opts.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || "";

  return async function sendViaSes(args: SendEmailArgs): Promise<void> {
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "SES autoresponder missing region or AWS credentials (AWS_SES_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)."
      );
    }
    const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
    const ses = new SESClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    await ses.send(
      new SendEmailCommand({
        Source: args.from,
        Destination: { ToAddresses: [args.to] },
        ReplyToAddresses: args.replyTo ? [args.replyTo] : undefined,
        Message: {
          Subject: { Data: args.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: args.text, Charset: "UTF-8" },
            ...(args.html
              ? { Html: { Data: args.html, Charset: "UTF-8" } }
              : {}),
          },
        },
      })
    );
  };
}

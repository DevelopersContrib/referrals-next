import { emailProvider } from "./send";
import { sendViaResend, sendViaSes } from "./send";
import type { AppSendEmailArgs, AppSendEmailOptions, SendEmailFn } from "./types";

/** Unified send adapter for @contrib/support-autoresponder and @contrib/engagement. */
export function createAppSendEmail(opts: AppSendEmailOptions = {}): SendEmailFn {
  return async (args: AppSendEmailArgs) => {
    if (emailProvider() === "resend") {
      await sendViaResend(args, { apiKey: opts.resendApiKey });
      return;
    }
    await sendViaSes(args, {
      region: opts.region,
      accessKeyId: opts.accessKeyId,
      secretAccessKey: opts.secretAccessKey,
    });
  };
}

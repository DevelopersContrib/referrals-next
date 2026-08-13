export type MailProvider = "ses" | "resend";

export type AppSendEmailArgs = {
  from: string;
  fromName?: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  /** RFC 8058 one-click unsubscribe URL (List-Unsubscribe header). */
  listUnsubscribeUrl?: string;
};

export type SendEmailFn = (args: AppSendEmailArgs) => Promise<void>;

export type AppSendEmailOptions = {
  /** SES region. Falls back to SES_REGION / AWS_SES_REGION / AWS_REGION. */
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  resendApiKey?: string;
};

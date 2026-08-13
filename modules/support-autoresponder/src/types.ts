/** Portable config — set per domain when installing the module. */
export type SupportAutoresponderConfig = {
  /** Brand shown in the email, e.g. "HomeManager" or "Handyman". */
  siteName: string;
  /** Public site origin, e.g. https://www.homemanager.com */
  siteUrl: string;
  /** From address (must be SES-verified when using the SES adapter). */
  fromEmail: string;
  /** Optional Reply-To (usually the support inbox). Defaults to fromEmail. */
  replyToEmail?: string;
  /** Support inbox shown in the body. Defaults to replyToEmail || fromEmail. */
  supportEmail?: string;
  /** Subject template. Tokens: {siteName} {subject} {name} */
  subjectTemplate?: string;
  /** Disable without removing the install. */
  enabled?: boolean;
};

export type SupportAutoresponderInput = {
  name: string;
  email: string;
  subject: string;
  message?: string;
  phone?: string;
  /** Extra footer line (ticket id, source site, etc.). */
  reference?: string;
};

export type SendEmailArgs = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailFn = (args: SendEmailArgs) => Promise<void>;

export type AutoresponderResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

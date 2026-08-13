/**
 * @contrib/support-autoresponder
 *
 * Drop-in support autoresponder for any domain in the network.
 * Copy this folder (or publish the package) and call `sendSupportAutoresponder`
 * after you accept a contact / support ticket.
 *
 * @example
 * ```ts
 * import { sendSupportAutoresponder, createSesSendEmail } from "@contrib/support-autoresponder";
 *
 * void sendSupportAutoresponder(
 *   {
 *     siteName: "HomeManager",
 *     siteUrl: "https://www.homemanager.com",
 *     fromEmail: process.env.SES_FROM_EMAIL!,
 *     replyToEmail: process.env.CONTACT_EMAIL,
 *     enabled: process.env.SUPPORT_AUTORESPONDER !== "0",
 *   },
 *   { name, email, subject, message },
 *   createSesSendEmail()
 * );
 * ```
 */

export { sendSupportAutoresponder } from "./send";
export { createSesSendEmail } from "./ses";
export type { SesAdapterOptions } from "./ses";
export { buildAutoresponderBodies, buildAutoresponderSubject } from "./templates";
export type {
  AutoresponderResult,
  SendEmailArgs,
  SendEmailFn,
  SupportAutoresponderConfig,
  SupportAutoresponderInput,
} from "./types";

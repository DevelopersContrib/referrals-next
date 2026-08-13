import PostalMime from "postal-mime";

/**
 * Cloudflare Email Worker → referrals-next support inbox.
 *
 * Email Routing for support@referrals.com should send to this Worker.
 * The Worker POSTs JSON to POST /api/webhooks/support-inbound with Bearer auth.
 *
 * Secrets (wrangler secret put …):
 *   SUPPORT_INBOUND_WEBHOOK_SECRET  — same value as Next.js .env
 *
 * Vars (wrangler.toml [vars]):
 *   WEBHOOK_URL  — e.g. https://www.referrals.com/api/webhooks/support-inbound
 */

export interface Env {
  WEBHOOK_URL: string;
  SUPPORT_INBOUND_WEBHOOK_SECRET: string;
}

/** Minimal Email Workers surface (avoids requiring generated wrangler types). */
interface EmailMessageLike {
  from: string;
  to: string;
  headers: Headers;
  raw: ReadableStream;
  setReject(reason: string): void;
}

export default {
  async email(
    message: EmailMessageLike,
    env: Env,
    _ctx: { waitUntil(p: Promise<unknown>): void }
  ): Promise<void> {
    const webhookUrl = (env.WEBHOOK_URL || "").trim();
    const secret = (env.SUPPORT_INBOUND_WEBHOOK_SECRET || "").trim();

    if (!webhookUrl || !secret) {
      console.error("[support-inbound] WEBHOOK_URL or SUPPORT_INBOUND_WEBHOOK_SECRET missing");
      message.setReject("Support inbound not configured");
      return;
    }

    try {
      // message.raw is a one-shot stream — buffer before parse
      const raw = await new Response(message.raw).arrayBuffer();
      const parsed = await PostalMime.parse(raw);

      const fromEmail =
        parsed.from?.address?.trim() || message.from?.trim() || "";
      const fromName = parsed.from?.name?.trim() || undefined;
      const subject = (
        parsed.subject ||
        message.headers.get("subject") ||
        "(no subject)"
      ).trim();
      const textBody = parsed.text?.trim() || undefined;
      const htmlBody = parsed.html?.trim() || undefined;

      if (!fromEmail) {
        console.error("[support-inbound] no from address");
        message.setReject("Missing From");
        return;
      }

      // redirect: "manual" — auth middleware 307→/signin looks like 405 if followed
      const res = await fetch(webhookUrl, {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          fromEmail,
          fromName,
          subject,
          textBody,
          htmlBody,
        }),
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location") || "";
        console.error(
          "[support-inbound] webhook redirected (is /api/webhooks/ public on the app?)",
          res.status,
          loc.slice(0, 200)
        );
        message.setReject(`Webhook redirected: ${res.status}`);
        return;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(
          "[support-inbound] webhook failed",
          res.status,
          errText.slice(0, 500)
        );
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          message.setReject(`Webhook rejected: ${res.status}`);
        }
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { publicId?: string };
      console.log("[support-inbound] ok", data.publicId || "threaded");
    } catch (err) {
      console.error("[support-inbound] error", err);
    }
  },
};

import { prisma } from "@/lib/prisma";
import { emailConfigured, sendAppEmail, rfDefaultFromEmail } from "@/lib/mail-send";

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "https://www.referrals.com"
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainToHtml(plain: string): string {
  return plain
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

async function loadTicket(ticketId: number) {
  return prisma.support_tickets.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        // Staff + AI agent public replies (email these to the requester)
        where: {
          is_internal: false,
          author_type: { in: ["staff", "agent"] },
        },
        orderBy: { created_at: "desc" },
        take: 1,
        select: { body: true, author_type: true },
      },
    },
  });
}

export async function notifySupportEscalated(ticketId: number): Promise<void> {
  if (!emailConfigured()) return;
  const to = rfDefaultFromEmail();
  try {
    const ticket = await loadTicket(ticketId);
    if (!ticket) return;
    const panelUrl = `${siteBase()}/admin/support/${ticket.id}`;
    await sendAppEmail({
      from: to,
      to,
      subject: `[Support] Escalated ${ticket.public_id}: ${ticket.subject.slice(0, 80)}`,
      html: `<p>Ticket <strong>${esc(ticket.public_id)}</strong> needs a human.</p>
<p>${esc(ticket.subject)}</p>
<p>From: ${esc(ticket.requester_email || ticket.requester_name || "—")}</p>
<p><a href="${esc(panelUrl)}">Open in admin</a></p>`,
      text: `Escalated ${ticket.public_id}. ${panelUrl}`,
    });
  } catch (err) {
    console.error("[support-notify] escalate failed:", err);
  }
}

export async function notifySupportStaffReply(
  ticketId: number,
  opts?: { staffName?: string }
): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const ticket = await loadTicket(ticketId);
    const email = ticket?.requester_email?.trim();
    if (!ticket || !email) return;

    const from = rfDefaultFromEmail();
    const name = ticket.requester_name?.trim() || "there";
    const replyBody = ticket.messages[0]?.body?.trim() || "";
    const subject = `Re: [${ticket.public_id}] ${ticket.subject}`.slice(0, 200);
    const fromAgent = ticket.messages[0]?.author_type === "agent";
    const staffLabel =
      opts?.staffName?.trim() ||
      (fromAgent ? "Referrals.com Support Assistant" : "Referrals.com Support");

    const html = replyBody
      ? `<p>Hi ${esc(name)},</p>${plainToHtml(replyBody)}<p style="font-size:12px;color:#666">Ref ${esc(ticket.public_id)} · Reply to this email to continue.</p>`
      : `<p>Hi ${esc(name)},</p><p>Our team replied to ticket <strong>${esc(ticket.public_id)}</strong>.</p>`;

    const text = replyBody
      ? `Hi ${name},\n\n${replyBody}\n\n— ${staffLabel}\nRef ${ticket.public_id}`
      : `Support replied on ${ticket.public_id}.`;

    await sendAppEmail({
      from,
      fromName: fromAgent ? "Referrals.com Support Assistant" : "Referrals.com Support",
      to: email,
      replyTo: from,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[support-notify] staff reply failed:", err);
  }
}

export async function notifySupportCustomerReply(ticketId: number): Promise<void> {
  if (!emailConfigured()) return;
  const to = rfDefaultFromEmail();
  try {
    const ticket = await loadTicket(ticketId);
    if (!ticket) return;
    const panelUrl = `${siteBase()}/admin/support/${ticket.id}`;
    await sendAppEmail({
      from: to,
      to,
      subject: `[Support] Reply on ${ticket.public_id}`,
      html: `<p>Customer replied on <strong>${esc(ticket.public_id)}</strong>.</p>
<p><a href="${esc(panelUrl)}">Open ticket</a></p>`,
      text: `Reply on ${ticket.public_id}. ${panelUrl}`,
    });
  } catch (err) {
    console.error("[support-notify] customer reply failed:", err);
  }
}

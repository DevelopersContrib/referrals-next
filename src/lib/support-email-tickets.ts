import { prisma } from "@/lib/prisma";
import { queueSupportAutoresponder } from "@/lib/support-autoresponder";
import { sendAppEmail, rfDefaultFromEmail } from "@/lib/mail-send";
import { AI_TURN_CAP, RF_SITE } from "@/lib/support-types";
import { queueAiTurn } from "@/lib/support-tickets";

export { RF_SITE };

const PUBLIC_ID_RE = /\bRF-(\d+)\b/i;

export async function allocateSupportPublicId(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const n = 1000 + Math.floor(Math.random() * 900000);
    const publicId = `RF-${n}`;
    const exists = await prisma.support_tickets.findUnique({
      where: { public_id: publicId },
      select: { id: true },
    });
    if (!exists) return publicId;
  }
  throw new Error("Could not allocate support public id");
}

export function extractPublicId(subject: string): string | null {
  const m = subject.match(PUBLIC_ID_RE);
  return m ? `RF-${m[1]}` : null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function resolveMember(email: string) {
  return prisma.members.findFirst({
    where: { email: normalizeEmail(email) },
    select: { id: true, name: true, email: true, plan_id: true, plan_expiry: true },
  });
}

function aiEnabled(): boolean {
  return (
    process.env.SUPPORT_AI_ENABLED !== "0" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

export async function createContactFormTicket(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ publicId: string; ticketId: number }> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim().slice(0, 120);
  const subject = "Contact form message";
  const body = input.message.trim().slice(0, 8000) || "(empty message)";

  const member = await resolveMember(email);
  const publicId = await allocateSupportPublicId();
  const now = new Date();
  const useAi = aiEnabled();

  const ticket = await prisma.support_tickets.create({
    data: {
      public_id: publicId,
      member_id: member?.id ?? null,
      requester_email: email,
      requester_name: name || member?.name || null,
      source: "contact_form",
      site: RF_SITE,
      subject,
      category: "other",
      priority: "normal",
      status: useAi ? "open" : "waiting_on_staff",
      ai_handling: useAi,
      ai_turn_count: 0,
      last_message_at: now,
      messages: {
        create: {
          author_type: "email",
          author_id: member?.id ?? null,
          body,
          is_internal: false,
        },
      },
    },
  });

  void sendAppEmail({
    from: rfDefaultFromEmail(),
    fromName: "Referrals.com Support",
    to: rfDefaultFromEmail(),
    replyTo: email,
    subject: `[Referrals.com] Contact: ${name} [${publicId}]`,
    text: `Name: ${name}\nEmail: ${email}\nTicket: ${publicId}\n\n${body}`,
    html: `<p><strong>${name}</strong> &lt;${email}&gt;</p><p>Ticket: ${publicId}</p><pre>${body}</pre>`,
  }).catch((e) => console.error("[contact] ops email failed", e));

  queueSupportAutoresponder({
    name,
    email,
    subject,
    message: body,
    reference: publicId,
  });

  if (useAi) queueAiTurn(ticket.id);

  return { publicId, ticketId: ticket.id };
}

/** Append inbound email to an open ticket; keep AI on until escalate / turn cap. */
async function appendInboundToTicket(input: {
  ticket: {
    id: number;
    public_id: string;
    ai_handling: boolean;
    ai_turn_count: number;
    escalated_at: Date | null;
    member_id: number | null;
    requester_email: string | null;
    requester_name: string | null;
  };
  memberId: number | null;
  fromEmail: string;
  fromName: string | null;
  body: string;
}): Promise<{ publicId: string; created: boolean; ticketId: number }> {
  const { ticket, memberId, fromEmail, fromName, body } = input;
  const keepAi =
    aiEnabled() &&
    !ticket.escalated_at &&
    ticket.ai_handling &&
    ticket.ai_turn_count < AI_TURN_CAP;

  await prisma.$transaction([
    prisma.support_ticket_messages.create({
      data: {
        ticket_id: ticket.id,
        author_type: "email",
        author_id: memberId,
        body,
        is_internal: false,
      },
    }),
    prisma.support_tickets.update({
      where: { id: ticket.id },
      data: {
        status: keepAi ? "open" : "waiting_on_staff",
        ai_handling: keepAi,
        last_message_at: new Date(),
        requester_email: ticket.requester_email || fromEmail,
        requester_name: ticket.requester_name || fromName,
        member_id: ticket.member_id ?? memberId,
      },
    }),
  ]);

  if (keepAi) {
    queueAiTurn(ticket.id);
  } else {
    const { notifySupportCustomerReply } = await import("@/lib/support-ticket-notify");
    void notifySupportCustomerReply(ticket.id).catch(() => {});
  }

  return { publicId: ticket.public_id, created: false, ticketId: ticket.id };
}

export async function ingestInboundSupportEmail(input: {
  fromEmail: string;
  fromName?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
}): Promise<{ publicId: string; created: boolean; ticketId: number }> {
  const fromEmail = normalizeEmail(input.fromEmail);
  if (!fromEmail) throw new Error("fromEmail is required");

  const subject = (input.subject || "(no subject)").trim().slice(0, 200);
  const body = (input.textBody || stripHtml(input.htmlBody || "") || "(empty message)")
    .trim()
    .slice(0, 12000);

  const member = await resolveMember(fromEmail);
  const fromName =
    (input.fromName || "").trim().slice(0, 120) || member?.name || null;

  const matchedId = extractPublicId(subject);
  if (matchedId) {
    const existing = await prisma.support_tickets.findFirst({
      where: { public_id: matchedId, site: RF_SITE },
    });
    if (existing && existing.status !== "closed") {
      return appendInboundToTicket({
        ticket: existing,
        memberId: member?.id ?? null,
        fromEmail,
        fromName,
        body,
      });
    }
  }

  const recent = await prisma.support_tickets.findFirst({
    where: {
      site: RF_SITE,
      requester_email: fromEmail,
      status: { in: ["open", "waiting_on_staff", "waiting_on_contractor"] },
      last_message_at: { gte: new Date(Date.now() - 14 * 86400000) },
    },
    orderBy: { last_message_at: "desc" },
  });

  if (recent) {
    return appendInboundToTicket({
      ticket: recent,
      memberId: member?.id ?? null,
      fromEmail,
      fromName,
      body,
    });
  }

  const publicId = await allocateSupportPublicId();
  const now = new Date();
  const useAi = aiEnabled();
  const ticket = await prisma.support_tickets.create({
    data: {
      public_id: publicId,
      member_id: member?.id ?? null,
      requester_email: fromEmail,
      requester_name: fromName,
      source: "inbound_email",
      site: RF_SITE,
      subject: subject.replace(/^Re:\s*/i, "").slice(0, 200) || "Inbound email",
      category: "other",
      priority: "normal",
      status: useAi ? "open" : "waiting_on_staff",
      ai_handling: useAi,
      ai_turn_count: 0,
      last_message_at: now,
      messages: {
        create: {
          author_type: "email",
          author_id: member?.id ?? null,
          body,
          is_internal: false,
        },
      },
    },
  });

  queueSupportAutoresponder({
    name: fromName || "there",
    email: fromEmail,
    subject: ticket.subject,
    message: body,
    reference: publicId,
  });

  if (useAi) queueAiTurn(ticket.id);

  return { publicId, created: true, ticketId: ticket.id };
}

import { prisma } from "@/lib/prisma";
import { runSupportAiAgent } from "@/lib/support-ai-agent";
import {
  notifySupportEscalated,
  notifySupportStaffReply,
  notifySupportCustomerReply,
} from "@/lib/support-ticket-notify";
import { RF_SITE } from "@/lib/support-types";
import {
  SupportTicketError,
  isStatus,
  isCategory,
  AI_TURN_CAP,
  type SupportStatus,
} from "@/lib/support-types";
import { postVnocSupportCase, postVnocSupportResolved } from "@/lib/vnoc-attribution";

export { SupportTicketError, AI_TURN_CAP };

function siteWhere() {
  return { site: RF_SITE };
}

export async function listPanelTickets(filters: {
  status?: string;
  source?: string;
  q?: string;
  take?: number;
}) {
  const and: Record<string, unknown>[] = [siteWhere()];
  if (filters.status && isStatus(filters.status)) and.push({ status: filters.status });
  if (filters.source?.trim()) and.push({ source: filters.source.trim() });

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { public_id: { contains: q } },
        { subject: { contains: q } },
        { requester_email: { contains: q } },
        { requester_name: { contains: q } },
      ],
    });
  }

  return prisma.support_tickets.findMany({
    where: { AND: and },
    orderBy: { last_message_at: "asc" },
    take: filters.take ?? 100,
  });
}

export async function getPanelTicket(id: number) {
  const ticket = await prisma.support_tickets.findFirst({
    where: { id, ...siteWhere() },
    include: {
      messages: { orderBy: { created_at: "asc" } },
    },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");

  let member = null;
  if (ticket.member_id) {
    member = await prisma.members.findUnique({
      where: { id: ticket.member_id },
      select: { id: true, name: true, email: true, plan_id: true, plan_expiry: true },
    });
  }

  return { ...ticket, member };
}

export async function updatePanelTicket(
  id: number,
  data: { status?: string; assigned_admin_id?: number | null; priority?: string }
) {
  const existing = await prisma.support_tickets.findFirst({
    where: { id, ...siteWhere() },
    select: { id: true, public_id: true, status: true },
  });
  if (!existing) throw new SupportTicketError("Ticket not found", "not_found");

  const patch: Record<string, unknown> = {};
  if (data.status && isStatus(data.status)) patch.status = data.status;
  if (data.priority === "high" || data.priority === "normal") patch.priority = data.priority;
  if (data.assigned_admin_id !== undefined) patch.assigned_admin_id = data.assigned_admin_id;
  if (data.status && data.status !== "waiting_on_staff") patch.ai_handling = false;

  await prisma.support_tickets.update({ where: { id }, data: patch });

  if (
    existing.status !== "resolved" &&
    existing.status !== "closed" &&
    (data.status === "resolved" || data.status === "closed")
  ) {
    void postVnocSupportResolved(`ticket:${existing.public_id}`);
  }

  return getPanelTicket(id);
}

export async function resolveStaffDisplayName(opts: {
  adminId?: number | null;
  email?: string | null;
  name?: string | null;
}): Promise<string> {
  if (opts.name?.trim()) return opts.name.trim().slice(0, 120);
  if (opts.adminId != null) {
    const m = await prisma.members.findUnique({
      where: { id: opts.adminId },
      select: { name: true },
    });
    if (m?.name?.trim()) return m.name.trim().slice(0, 120);
  }
  if (opts.email?.trim()) return opts.email.split("@")[0].slice(0, 120);
  return "Referrals.com Support";
}

function withStaffSignature(body: string, staffName: string): string {
  const trimmed = body.trim();
  if (/Referrals\.com Support\s*$/i.test(trimmed) || /^—\s+/m.test(trimmed)) return trimmed;
  if (/^referrals\.com support$/i.test(staffName.trim())) {
    return `${trimmed}\n\n— Referrals.com Support`;
  }
  return `${trimmed}\n\n— ${staffName}\nReferrals.com Support`;
}

export async function addStaffMessage(input: {
  ticketId: number;
  adminId: number;
  body: string;
  isInternal?: boolean;
  staffName?: string;
}) {
  const raw = input.body.trim().slice(0, 8000);
  if (!raw) throw new SupportTicketError("Message is required", "validation");

  const ticket = await prisma.support_tickets.findFirst({
    where: { id: input.ticketId, ...siteWhere() },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");

  const isInternal = Boolean(input.isInternal);
  const staffName =
    input.staffName?.trim() ||
    (await resolveStaffDisplayName({ adminId: input.adminId }));
  const body = isInternal ? raw : withStaffSignature(raw, staffName).slice(0, 8000);
  const now = new Date();

  let nextStatus: SupportStatus = ticket.status as SupportStatus;
  if (!isInternal && ticket.status !== "resolved" && ticket.status !== "closed") {
    nextStatus = "waiting_on_contractor";
  }

  await prisma.$transaction([
    prisma.support_ticket_messages.create({
      data: {
        ticket_id: input.ticketId,
        author_type: "staff",
        author_id: input.adminId,
        body,
        is_internal: isInternal,
      },
    }),
    prisma.support_tickets.update({
      where: { id: input.ticketId },
      data: {
        ai_handling: false,
        last_message_at: now,
        status: nextStatus,
        assigned_admin_id: ticket.assigned_admin_id ?? input.adminId,
      },
    }),
  ]);

  if (!isInternal) {
    void notifySupportStaffReply(input.ticketId, { staffName }).catch(() => {});
  }

  return getPanelTicket(input.ticketId);
}

async function escalateTicket(ticketId: number, reason: string, postPublicHandoff: boolean) {
  const now = new Date();
  const reasonTrim = reason.trim().slice(0, 500) || "Escalated to staff";

  await prisma.$transaction(async (tx) => {
    if (postPublicHandoff) {
      await tx.support_ticket_messages.create({
        data: {
          ticket_id: ticketId,
          author_type: "agent",
          body: "I'm connecting you with our support team — a team member will follow up shortly.",
          is_internal: false,
        },
      });
    }
    await tx.support_ticket_messages.create({
      data: {
        ticket_id: ticketId,
        author_type: "agent",
        body: reasonTrim,
        is_internal: true,
      },
    });
    await tx.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: "waiting_on_staff",
        ai_handling: false,
        escalated_at: now,
        escalation_reason: reasonTrim,
        last_message_at: now,
      },
    });
  });

  if (postPublicHandoff) {
    void notifySupportStaffReply(ticketId, {
      staffName: "Referrals.com Support Assistant",
    }).catch(() => {});
  }
  void notifySupportEscalated(ticketId).catch(() => {});
}

async function handleAiTurn(ticketId: number) {
  const ticket = await prisma.support_tickets.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        where: { is_internal: false },
        orderBy: { created_at: "asc" },
        take: 20,
      },
    },
  });
  if (!ticket || !ticket.ai_handling) return;
  if (ticket.ai_turn_count >= AI_TURN_CAP) {
    await escalateTicket(ticketId, "AI turn cap reached", true);
    return;
  }

  let member = null;
  if (ticket.member_id) {
    member = await prisma.members.findUnique({
      where: { id: ticket.member_id },
      select: { plan_id: true, plan_expiry: true },
    });
  }

  let decision;
  try {
    decision = await runSupportAiAgent({
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      source: ticket.source,
      messages: ticket.messages.map((m) => ({ author_type: m.author_type, body: m.body })),
      member,
    });
  } catch (err) {
    console.error("[support-ai] agent error:", err);
    await escalateTicket(ticketId, "ai_error: OpenAI failed", true);
    return;
  }

  const now = new Date();
  const reply = decision.reply.trim().slice(0, 8000) || "Thanks for reaching out.";

  if (decision.action === "escalate" || decision.confidence < 0.75) {
    await prisma.support_ticket_messages.create({
      data: { ticket_id: ticketId, author_type: "agent", body: reply, is_internal: false },
    });
    await prisma.support_tickets.update({
      where: { id: ticketId },
      data: { ai_turn_count: { increment: 1 }, last_message_at: now },
    });
    // Email the AI handoff reply, then mark for staff
    void notifySupportStaffReply(ticketId, {
      staffName: "Referrals.com Support Assistant",
    }).catch(() => {});
    await escalateTicket(ticketId, decision.internal_note || decision.reply, false);
    return;
  }

  const agentBody =
    decision.action === "resolve"
      ? `${reply}\n\n— Did this help? Reply if you still need assistance.`
      : reply;

  // Keep ai_handling true so follow-up replies can get another AI turn until escalate/cap
  await prisma.$transaction([
    prisma.support_ticket_messages.create({
      data: { ticket_id: ticketId, author_type: "agent", body: agentBody, is_internal: false },
    }),
    prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: "waiting_on_contractor",
        ai_turn_count: { increment: 1 },
        last_message_at: now,
      },
    }),
  ]);

  void notifySupportStaffReply(ticketId, {
    staffName: "Referrals.com Support Assistant",
  }).catch(() => {});
}

export function queueAiTurn(ticketId: number) {
  void handleAiTurn(ticketId).catch((e) => console.error("[support-ai] turn failed", ticketId, e));
}

/** Tickets owned by this member (by member_id or matching requester email). */
async function memberTicketWhere(memberId: number) {
  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, email: true, name: true },
  });
  if (!member) throw new SupportTicketError("Member not found", "not_found");
  const email = (member.email || "").trim().toLowerCase();
  return {
    member,
    where: {
      ...siteWhere(),
      OR: [
        { member_id: memberId },
        ...(email ? [{ requester_email: email }] : []),
      ],
    },
  };
}

export async function listMemberTickets(memberId: number) {
  const { where } = await memberTicketWhere(memberId);
  return prisma.support_tickets.findMany({
    where,
    orderBy: { last_message_at: "desc" },
    take: 100,
    select: {
      id: true,
      public_id: true,
      subject: true,
      category: true,
      priority: true,
      status: true,
      ai_handling: true,
      last_message_at: true,
      created_at: true,
    },
  });
}

export async function getMemberTicket(memberId: number, publicId: string) {
  const { where } = await memberTicketWhere(memberId);
  const ticket = await prisma.support_tickets.findFirst({
    where: { ...where, public_id: publicId },
    include: {
      messages: {
        where: { is_internal: false },
        orderBy: { created_at: "asc" },
      },
    },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");
  return ticket;
}

export async function createMemberSupportTicket(input: {
  memberId: number;
  subject: string;
  body: string;
  category?: string;
  priority?: string;
}) {
  const subject = input.subject.trim().slice(0, 200);
  const body = input.body.trim().slice(0, 8000);
  if (subject.length < 3) throw new SupportTicketError("Subject is required", "validation");
  if (body.length < 5) throw new SupportTicketError("Message is required", "validation");

  const member = await prisma.members.findUnique({
    where: { id: input.memberId },
    select: { id: true, email: true, name: true },
  });
  if (!member?.email?.trim()) {
    throw new SupportTicketError("Member not found", "not_found");
  }

  const recent = await prisma.support_tickets.count({
    where: {
      member_id: input.memberId,
      ...siteWhere(),
      created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recent >= 8) {
    throw new SupportTicketError(
      "Too many tickets created recently. Try again later.",
      "rate_limit"
    );
  }

  const category = input.category && isCategory(input.category) ? input.category : "other";
  const priority = input.priority === "high" ? "high" : "normal";
  // Dynamic import avoids circular dep with support-email-tickets → queueAiTurn
  const { allocateSupportPublicId } = await import("@/lib/support-email-tickets");
  const { queueSupportAutoresponder } = await import("@/lib/support-autoresponder");
  const publicId = await allocateSupportPublicId();
  const now = new Date();
  const useAi = process.env.SUPPORT_AI_ENABLED !== "0" && Boolean(process.env.OPENAI_API_KEY?.trim());

  const ticket = await prisma.support_tickets.create({
    data: {
      public_id: publicId,
      member_id: member.id,
      requester_email: member.email.trim().toLowerCase(),
      requester_name: (member.name || "").trim().slice(0, 120) || null,
      source: "member_dashboard",
      site: RF_SITE,
      subject,
      category,
      priority,
      status: useAi ? "open" : "waiting_on_staff",
      ai_handling: useAi,
      ai_turn_count: 0,
      last_message_at: now,
      messages: {
        create: {
          author_type: "customer",
          author_id: member.id,
          body,
          is_internal: false,
        },
      },
    },
  });

  queueSupportAutoresponder({
    name: member.name || "there",
    email: member.email,
    subject,
    message: body,
    reference: publicId,
  });

  void postVnocSupportCase(`ticket:${publicId}`);

  if (useAi) queueAiTurn(ticket.id);

  return getMemberTicket(member.id, publicId);
}

export async function addMemberReply(input: {
  memberId: number;
  publicId: string;
  body: string;
}) {
  const body = input.body.trim().slice(0, 8000);
  if (body.length < 1) throw new SupportTicketError("Message is required", "validation");

  const { where } = await memberTicketWhere(input.memberId);
  const ticket = await prisma.support_tickets.findFirst({
    where: { ...where, public_id: input.publicId },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");
  if (ticket.status === "closed") {
    throw new SupportTicketError("This ticket is closed", "validation");
  }

  const now = new Date();
  let nextStatus = ticket.status;
  if (ticket.status === "resolved" || ticket.status === "waiting_on_contractor") {
    nextStatus = ticket.ai_handling ? "open" : "waiting_on_staff";
  } else if (ticket.status === "open") {
    nextStatus = ticket.ai_handling ? "open" : "waiting_on_staff";
  }

  await prisma.$transaction([
    prisma.support_ticket_messages.create({
      data: {
        ticket_id: ticket.id,
        author_type: "customer",
        author_id: input.memberId,
        body,
        is_internal: false,
      },
    }),
    prisma.support_tickets.update({
      where: { id: ticket.id },
      data: {
        last_message_at: now,
        status: nextStatus,
        member_id: ticket.member_id ?? input.memberId,
      },
    }),
  ]);

  if (ticket.ai_handling && ticket.ai_turn_count < AI_TURN_CAP) {
    queueAiTurn(ticket.id);
  } else if (!ticket.ai_handling) {
    void notifySupportCustomerReply(ticket.id).catch(() => {});
  }

  return getMemberTicket(input.memberId, input.publicId);
}

export async function markTicketResolvedByMember(memberId: number, publicId: string) {
  const { where } = await memberTicketWhere(memberId);
  const ticket = await prisma.support_tickets.findFirst({
    where: { ...where, public_id: publicId },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");

  await prisma.support_tickets.update({
    where: { id: ticket.id },
    data: { status: "resolved", ai_handling: false },
  });

  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    void postVnocSupportResolved(`ticket:${publicId}`);
  }

  return getMemberTicket(memberId, publicId);
}

export async function escalateTicketByMember(memberId: number, publicId: string) {
  const { where } = await memberTicketWhere(memberId);
  const ticket = await prisma.support_tickets.findFirst({
    where: { ...where, public_id: publicId },
  });
  if (!ticket) throw new SupportTicketError("Ticket not found", "not_found");

  await escalateTicket(ticket.id, "Member requested a human", true);
  return getMemberTicket(memberId, publicId);
}

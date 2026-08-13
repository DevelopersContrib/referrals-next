import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupportTicketThread from "@/components/support/SupportTicketThread";
import { getMemberTicket, SupportTicketError } from "@/lib/support-tickets";

export const metadata = { title: "Support ticket | Referrals.com" };

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  waiting_on_staff: "With our team",
  waiting_on_contractor: "Needs your reply",
  resolved: "Resolved",
  closed: "Closed",
};

type Props = { params: Promise<{ publicId: string }> };

export default async function MemberSupportTicketPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    const { publicId } = await params;
    redirect(`/signin?callbackUrl=/dashboard/support/${publicId}`);
  }
  const memberId = parseInt(session.user.id, 10);
  if (!Number.isFinite(memberId)) redirect("/signin");

  const { publicId } = await params;

  let ticket;
  try {
    ticket = await getMemberTicket(memberId, publicId);
  } catch (e) {
    if (e instanceof SupportTicketError && e.code === "not_found") notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/support"
        className="text-sm font-semibold text-brand hover:underline"
      >
        ← All tickets
      </Link>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold text-brand">{ticket.public_id}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1c1917]">
            {ticket.subject}
          </h1>
          <p className="mt-1 text-xs capitalize text-[#a7abc3]">
            {ticket.category} · {STATUS_LABEL[ticket.status] || ticket.status}
            {ticket.ai_handling ? " · AI assisting" : ""}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <SupportTicketThread
          publicId={ticket.public_id}
          status={ticket.status}
          aiHandling={ticket.ai_handling}
          messages={ticket.messages.map((m) => ({
            id: m.id,
            author_type: m.author_type,
            body: m.body,
            created_at: m.created_at,
          }))}
        />
      </div>
    </div>
  );
}

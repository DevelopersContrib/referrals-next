import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listMemberTickets } from "@/lib/support-tickets";

export const metadata = { title: "Support | Referrals.com" };

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  waiting_on_staff: "With our team",
  waiting_on_contractor: "Needs your reply",
  resolved: "Resolved",
  closed: "Closed",
};

export default async function MemberSupportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/dashboard/support");
  const memberId = parseInt(session.user.id, 10);
  if (!Number.isFinite(memberId)) redirect("/signin?callbackUrl=/dashboard/support");

  const tickets = await listMemberTickets(memberId);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Help</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1c1917]">Support</h1>
          <p className="mt-2 max-w-xl text-sm text-[#78716c]">
            Open a ticket for billing, campaigns, account, or technical help. Reply in the thread —
            same inbox as support@referrals.com.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/support" className="font-semibold text-brand hover:underline">
              Browse the help center →
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/support/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
        >
          New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-[#ebeef0] bg-white p-10 text-center">
          <p className="font-semibold text-[#575962]">No tickets yet</p>
          <p className="mt-2 text-sm text-[#a7abc3]">
            Start a conversation — AI may reply first, and our team can take over anytime.
          </p>
          <Link
            href="/dashboard/support/new"
            className="mt-5 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start a ticket
          </Link>
        </section>
      ) : (
        <section className="mt-8 overflow-hidden rounded-2xl border border-[#ebeef0] bg-white shadow-sm">
          <div className="divide-y divide-[#f2f3f8]">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.public_id}`}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-[#fafaf9] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-brand">{t.public_id}</p>
                  <p className="truncate font-semibold text-[#1c1917]">{t.subject}</p>
                  <p className="text-xs capitalize text-[#a7abc3]">{t.category}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-[#f2f3f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#575962]">
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                  <time className="text-xs text-[#a7abc3]" suppressHydrationWarning>
                    {t.last_message_at.toLocaleDateString("en-US")}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

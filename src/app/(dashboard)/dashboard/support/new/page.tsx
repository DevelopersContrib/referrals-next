import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import NewSupportTicketForm from "@/components/support/NewSupportTicketForm";

export const metadata = { title: "New support ticket | Referrals.com" };

export default async function NewMemberSupportTicketPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/dashboard/support/new");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/support"
        className="text-sm font-semibold text-brand hover:underline"
      >
        ← All tickets
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-[#1c1917]">New ticket</h1>
      <p className="mt-2 text-sm text-[#78716c]">
        Describe your question. You&apos;ll get an email confirmation and can continue the
        conversation in this thread.
      </p>
      <div className="mt-6">
        <NewSupportTicketForm />
      </div>
    </div>
  );
}

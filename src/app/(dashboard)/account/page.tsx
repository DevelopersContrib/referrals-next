import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AccountForm } from "./account-form";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true },
  });

  if (!member) redirect("/signin");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account information and password.
        </p>
      </div>

      <AccountForm
        initialName={member.name}
        initialEmail={member.email}
      />
    </div>
  );
}

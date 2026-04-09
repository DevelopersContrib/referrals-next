import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountForm } from "./account-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HomeIcon,
  ChevronRightIcon,
  UserIcon,
  MailIcon,
  CrownIcon,
  ArrowRightIcon,
} from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true },
  });

  if (!member) redirect("/signin");

  const initials = member.name
    ? member.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : member.email.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-brand transition-colors"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">Account Settings</span>
      </nav>

      {/* Page Header */}
      <div className="subheader">
        <h1 className="text-xl font-bold text-white">Account Settings</h1>
        <p className="mt-0.5 text-sm text-white/70">
          Manage your profile information and security settings.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-3">
          <div className="portlet text-center">
            <Avatar className="mx-auto size-20 border-2 border-[#ebeef0]">
              <AvatarFallback className="bg-brand/10 text-xl font-bold text-brand">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-4 text-lg font-semibold text-[#575962]">
              {member.name}
            </h3>

            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-[#a7abc3]">
              <MailIcon className="size-3.5" />
              {member.email}
            </div>

            <div className="mt-4">
              <Badge className="border-0 bg-[#f2f3f8] px-3 py-1 text-[#a7abc3] font-medium">
                Free Plan
              </Badge>
            </div>

            <div className="mt-4 border-t border-[#ebeef0] pt-4">
              <Link href="/billing">
                <Button className="w-full gap-2 bg-brand text-white hover:bg-brand-hover">
                  <CrownIcon className="size-4" />
                  Upgrade Plan
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </Link>
            </div>

            <div className="mt-3 space-y-1.5 text-left">
              <Link
                href="/api-keys"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#575962] transition-colors hover:bg-[#f2f3f8] hover:text-brand"
              >
                <UserIcon className="size-4" />
                API Keys
              </Link>
              <Link
                href="/billing"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#575962] transition-colors hover:bg-[#f2f3f8] hover:text-brand"
              >
                <CrownIcon className="size-4" />
                Billing
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Form */}
        <div className="lg:col-span-9">
          <AccountForm initialName={member.name} initialEmail={member.email} />
        </div>
      </div>
    </div>
  );
}

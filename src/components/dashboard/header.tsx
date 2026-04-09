"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  SearchIcon,
  ChevronDownIcon,
  UserIcon,
  SettingsIcon,
  CreditCardIcon,
  HelpCircleIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  GlobeIcon,
  PlusIcon,
  WrenchIcon,
  MessageSquareIcon,
  LifeBuoyIcon,
  BookOpenIcon,
  ShareIcon,
  MenuIcon,
  BellIcon,
  KeyIcon,
} from "lucide-react";

export function DashboardHeader() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || "U";

  const userName = session?.user?.name || session?.user?.email || "User";

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#ebeef0] bg-white px-4 lg:px-6">
      {/* Left: Logo + Sidebar trigger */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Link href="/dashboard" className="hidden items-center gap-2.5 lg:flex">
          <Image
            src="/images/logo/logo2.png"
            alt="Referrals.com"
            width={130}
            height={38}
            className="h-[34px] w-auto"
            priority
          />
        </Link>
      </div>

      {/* Center: Navigation */}
      <nav className="hidden items-center gap-1 lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[#575962] transition-colors hover:bg-[#f2f3f8] hover:text-brand"
        >
          <LayoutDashboardIcon className="size-4" />
          Dashboard
        </Link>

        {/* My Brands Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[#575962] transition-colors hover:bg-[#f2f3f8] hover:text-brand">
            <GlobeIcon className="size-4" />
            My Brands
            <ChevronDownIcon className="size-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8}>
            <DropdownMenuLabel>My Brands</DropdownMenuLabel>
            <DropdownMenuItem render={<Link href="/brands" />}>
              <GlobeIcon className="size-4" />
              View All Brands
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/brands/new" />}>
              <PlusIcon className="size-4" />
              Create New Brand
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Resources Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-[#575962] transition-colors hover:bg-[#f2f3f8] hover:text-brand">
            <BookOpenIcon className="size-4" />
            Resources
            <ChevronDownIcon className="size-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8}>
            <DropdownMenuItem render={<Link href="/tools" />}>
              <WrenchIcon className="size-4" />
              Tools
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/forum" />}>
              <MessageSquareIcon className="size-4" />
              Discussions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/promotions" />}>
              <ShareIcon className="size-4" />
              Refer Us
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href="https://referrals.com/support" target="_blank" rel="noopener noreferrer" />}>
              <LifeBuoyIcon className="size-4" />
              Support
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href="https://referrals.com/blog" target="_blank" rel="noopener noreferrer" />}>
              <BookOpenIcon className="size-4" />
              Blog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Right: Search + User */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#a7abc3]" />
          <Input
            type="search"
            placeholder="Search..."
            className="h-8 w-[180px] border-[#ebeef0] bg-[#f7f8fa] pl-8 text-sm placeholder:text-[#a7abc3] focus:w-[240px] focus:border-brand focus:bg-white transition-all"
          />
        </div>

        {/* Notifications */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon-sm" className="text-[#a7abc3] hover:text-brand">
            <BellIcon className="size-4" />
          </Button>
        </Link>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#f2f3f8]">
            <Avatar className="size-8 border border-[#ebeef0]">
              <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left lg:block">
              <span className="block text-sm font-medium leading-tight text-[#575962]">
                {userName}
              </span>
            </div>
            <ChevronDownIcon className="hidden size-3.5 text-[#a7abc3] lg:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-52">
            <div className="border-b border-[#ebeef0] px-3 py-2.5">
              <p className="text-sm font-semibold text-[#575962]">{userName}</p>
              <p className="text-xs text-[#a7abc3]">{session?.user?.email}</p>
            </div>
            <DropdownMenuItem render={<Link href="/account" />} className="gap-2.5 px-3 py-2">
              <UserIcon className="size-4 text-brand" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/api-keys" />} className="gap-2.5 px-3 py-2">
              <KeyIcon className="size-4 text-[#36a3f7]" />
              API Keys
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/billing" />} className="gap-2.5 px-3 py-2">
              <CreditCardIcon className="size-4 text-[#28a745]" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem render={<a href="https://referrals.com/support" target="_blank" rel="noopener noreferrer" />} className="gap-2.5 px-3 py-2">
              <HelpCircleIcon className="size-4 text-[#ffc107]" />
              FAQ & Support
            </DropdownMenuItem>
            {(session?.user as any)?.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/admin" />} className="gap-2.5 px-3 py-2 text-red-600">
                  <SettingsIcon className="size-4" />
                  Admin Panel
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-2.5 px-3 py-2 text-[#dc3545]"
            >
              <LogOutIcon className="size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

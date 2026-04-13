"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  GlobeIcon,
  PlusIcon,
  WrenchIcon,
  MessageSquareIcon,
  CreditCardIcon,
  UserIcon,
  BarChart3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  KeyIcon,
  MegaphoneIcon,
  ImageIcon,
  StarIcon,
  HandshakeIcon,
  TargetIcon,
  MailIcon,
  MonitorIcon,
  ShareIcon,
} from "lucide-react";

const DASHBOARD_LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Brands", href: "/brands", icon: GlobeIcon },
  { title: "Stats", href: "/stats", icon: BarChart3Icon },
  { title: "Contacts", href: "/contacts", icon: UsersIcon },
];

const toolsNav = [
  { title: "All Tools", href: "/tools", icon: WrenchIcon },
  { title: "Banners", href: "/tools/banners", icon: ImageIcon },
  { title: "Reviews", href: "/tools/reviews", icon: StarIcon },
  { title: "Testimonials", href: "/tools/testimonials", icon: MessageSquareIcon },
  { title: "Partnerships", href: "/tools/partnerships", icon: HandshakeIcon },
  { title: "Ads", href: "/tools/ads", icon: TargetIcon },
  { title: "Email", href: "/tools/email", icon: MailIcon },
  { title: "Shoutouts", href: "/tools/shoutouts", icon: MegaphoneIcon },
  { title: "Promotions", href: "/promotions", icon: ShareIcon },
];

const bottomNav = [
  { title: "Forum", href: "/forum", icon: MessageSquareIcon },
  { title: "Billing", href: "/billing", icon: CreditCardIcon },
  { title: "API Keys", href: "/api-keys", icon: KeyIcon },
  { title: "Account", href: "/account", icon: UserIcon },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(
    pathname.startsWith("/tools") || pathname.startsWith("/promotions")
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-[#ebeef0] px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src={DASHBOARD_LOGO_URL}
            alt="Referrals.com"
            width={142}
            height={45}
            className="h-[36px] w-auto"
            unoptimized
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-3">
        {/* Create Brand Button */}
        <div className="px-2 pb-2">
          <Link href="/brands/new" className="block">
            <Button className="w-full gap-2 bg-brand font-medium text-white hover:bg-brand-hover">
              <PlusIcon className="size-4" />
              Create Brand
            </Button>
          </Link>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      className={isActive ? "bg-brand/5 text-brand font-medium" : "text-[#575962]"}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tools Section (collapsible) */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
            Tools & Marketing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className="text-[#575962]"
                >
                  <WrenchIcon className="size-4" />
                  <span>Tools</span>
                  {toolsOpen ? (
                    <ChevronDownIcon className="ml-auto size-3.5 text-[#a7abc3]" />
                  ) : (
                    <ChevronRightIcon className="ml-auto size-3.5 text-[#a7abc3]" />
                  )}
                </SidebarMenuButton>
                {toolsOpen && (
                  <SidebarMenuSub>
                    {toolsNav.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = pathname === tool.href;
                      return (
                        <SidebarMenuSubItem key={tool.href}>
                          <SidebarMenuSubButton
                            isActive={isActive}
                            render={<Link href={tool.href} />}
                            className={isActive ? "text-brand font-medium" : ""}
                          >
                            <Icon className="size-3.5" />
                            <span>{tool.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Links */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
            Quick Links
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.href} />}
                      className={isActive ? "bg-brand/5 text-brand font-medium" : "text-[#575962]"}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#ebeef0] px-4 py-3">
        <p className="text-xs text-[#a7abc3]">&copy; 2026 Referrals.com</p>
      </SidebarFooter>
    </Sidebar>
  );
}

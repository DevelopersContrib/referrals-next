"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  SidebarFooter,
} from "@/components/ui/sidebar";

const overviewNav = [
  { title: "Admin Dashboard", href: "/admin" },
];

const managementNav = [
  { title: "Members", href: "/admin/members" },
  { title: "Brands", href: "/admin/brands" },
  { title: "Campaigns", href: "/admin/campaigns" },
  { title: "Participants", href: "/admin/participants" },
  { title: "Coupons", href: "/admin/coupons" },
  { title: "Deals", href: "/admin/deals" },
  { title: "Contests", href: "/admin/contests" },
];

const billingNav = [
  { title: "Plans", href: "/admin/plans" },
  { title: "Payments", href: "/admin/payments" },
];

const contentNav = [
  { title: "Blog", href: "/admin/blog" },
  { title: "Forum", href: "/admin/forum" },
  { title: "Reviews", href: "/admin/reviews" },
  { title: "Testimonials", href: "/admin/testimonials" },
  { title: "Email Templates", href: "/admin/email-templates" },
];

const systemNav = [
  { title: "Integrations", href: "/admin/integrations" },
  { title: "API Keys", href: "/admin/api-keys" },
  { title: "Subdomains", href: "/admin/subdomains" },
  { title: "Cron Jobs", href: "/admin/cron" },
  { title: "Email Logs", href: "/admin/emails" },
  { title: "Settings", href: "/admin/settings" },
];

function NavGroup({ label, items }: { label?: string; items: { title: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href + "/"))
                }
                render={<Link href={item.href} />}
              >
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/admin" className="text-xl font-bold text-red-600">
          Admin Panel
        </Link>
        <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline">
          &larr; Back to Dashboard
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={overviewNav} />
        <NavGroup label="Management" items={managementNav} />
        <NavGroup label="Billing" items={billingNav} />
        <NavGroup label="Content" items={contentNav} />
        <NavGroup label="System" items={systemNav} />
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">Admin v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}

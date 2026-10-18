"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  BadgeCheckIcon,
  CreditCardIcon,
  UserIcon,
  BarChart3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  KeyIcon,
  MegaphoneIcon,
  LifeBuoyIcon,
  GiftIcon,
  SettingsIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brands/brand-logo";

const DASHBOARD_LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
];

const brandsNav = [
  {
    title: "All Brands",
    href: "/brands/allbrands",
    adminOnly: true,
  },
  { title: "View All Brands", href: "/brands" },
];



/** Sections every brand has; the switcher keeps you in the same one. */
const BRAND_SECTIONS = ["campaigns", "stats", "contacts", "tools", "white-label", "billing", "edit"];

function brandMenu(brandId: number) {
  const base = `/brands/${brandId}`;
  return [
    { title: "Overview", section: "", href: base, icon: LayoutDashboardIcon },
    { title: "Campaigns", section: "campaigns", href: `${base}/campaigns`, icon: MegaphoneIcon },
    { title: "Stats", section: "stats", href: `${base}/stats`, icon: BarChart3Icon },
    { title: "Contacts", section: "contacts", href: `${base}/contacts`, icon: UsersIcon },
    { title: "Tools", section: "tools", href: `${base}/tools`, icon: WrenchIcon },
    { title: "White label", section: "white-label", href: `${base}/white-label`, icon: BadgeCheckIcon },
    { title: "Billing", section: "billing", href: `${base}/billing`, icon: CreditCardIcon },
    { title: "Settings", section: "edit", href: `${base}/edit`, icon: SettingsIcon },
  ];
}

const bottomNav = [
  { title: "Refer & Earn", href: "/refer", icon: GiftIcon },
  { title: "Forum", href: "/forum", icon: MessageSquareIcon },
  { title: "Support", href: "/dashboard/support", icon: LifeBuoyIcon },
  { title: "Billing", href: "/billing", icon: CreditCardIcon },
  { title: "API Keys", href: "/api-keys", icon: KeyIcon },
  { title: "Account", href: "/account", icon: UserIcon },
];

export function DashboardSidebar({
  brands = [],
}: {
  brands?: { id: number; domain: string; logo_url?: string | null }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Inside /brands/{id}/... show that brand's own menu.
  const brandMatch = pathname.match(/^\/brands\/(\d+)(?:\/([a-z-]+))?/);
  const activeBrand = brandMatch
    ? brands.find((b) => b.id === Number(brandMatch[1])) ?? null
    : null;
  const brandSection =
    brandMatch?.[2] && BRAND_SECTIONS.includes(brandMatch[2]) ? brandMatch[2] : "";
  const { data: session } = useSession();
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean })?.isAdmin);
  const [brandsOpen, setBrandsOpen] = useState(pathname.startsWith("/brands"));

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
        {activeBrand ? (
          <>
            {/* Inside a brand: only the brand menu, plus a way back out. */}
            <div className="px-2 pb-2">
              <Link
                href="/dashboard"
                className="flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[#575962] transition hover:bg-brand/5 hover:text-brand"
              >
                <ArrowLeftIcon className="size-4" aria-hidden="true" />
                Dashboard
              </Link>
            </div>
          {/* Brand menu: everything about the brand you're in */}
          {activeBrand && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                Brand
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="mx-2 mb-2 rounded-xl border border-[#ebeef0] bg-white p-2">
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      domain={activeBrand.domain}
                      logoUrl={activeBrand.logo_url}
                      imgClassName="size-8 shrink-0 rounded-lg border bg-white object-contain p-0.5"
                      fallbackClassName="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500"
                    />
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">Switch brand</span>
                      <select
                        value={activeBrand.id}
                        onChange={(e) => {
                          const id = e.target.value;
                          router.push(`/brands/${id}${brandSection ? `/${brandSection}` : ""}`);
                        }}
                        className="w-full truncate rounded-md border-0 bg-transparent py-1 pr-6 text-sm font-semibold text-[#3f4047] focus:ring-2 focus:ring-brand/30"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.domain}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <SidebarMenu>
                  {brandMenu(activeBrand.id).map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.section === ""
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          )}

          </>
        ) : (
          <>
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
                {mainNav.slice(0, 1).map((item) => {
                  const Icon = item.icon;
                  // Exact /dashboard only — /dashboard/support is its own nav item
                  const isActive = pathname === item.href;
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

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setBrandsOpen(!brandsOpen)}
                    isActive={pathname.startsWith("/brands")}
                    className={
                      pathname.startsWith("/brands")
                        ? "bg-brand/5 text-brand font-medium"
                        : "text-[#575962]"
                    }
                  >
                    <GlobeIcon className="size-4" />
                    <span>My Brands</span>
                    {brandsOpen ? (
                      <ChevronDownIcon className="ml-auto size-3.5 text-[#a7abc3]" />
                    ) : (
                      <ChevronRightIcon className="ml-auto size-3.5 text-[#a7abc3]" />
                    )}
                  </SidebarMenuButton>
                  {brandsOpen && (
                    <SidebarMenuSub>
                      {brands.map((brand) => {
                        const href = `/brands/${brand.id}`;
                        const isActive =
                          pathname === href || pathname.startsWith(`${href}/`);
                        return (
                          <SidebarMenuSubItem key={brand.id}>
                            <SidebarMenuSubButton
                              isActive={isActive}
                              render={<Link href={href} />}
                              className={isActive ? "text-brand font-medium" : ""}
                            >
                              <span
                                aria-hidden
                                className="flex size-3.5 shrink-0 items-center justify-center text-base leading-none text-[#a7abc3]"
                              >
                                ·
                              </span>
                              <span className="truncate">{brand.domain}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                      {brandsNav
                        .filter((item) => !item.adminOnly || isAdmin)
                        .map((item) => {
                        const isActive =
                          item.href === "/brands/allbrands"
                            ? pathname === item.href ||
                              pathname.startsWith(item.href + "/")
                            : pathname === item.href;
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              isActive={isActive}
                              render={<Link href={item.href} />}
                              className={isActive ? "text-brand font-medium" : ""}
                            >
                              <span
                                aria-hidden
                                className="flex size-3.5 shrink-0 items-center justify-center text-base leading-none text-[#a7abc3]"
                              >
                                ·
                              </span>
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate">{item.title}</span>
                                {item.adminOnly && (
                                  <span className="shrink-0 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-white">
                                    Admin
                                  </span>
                                )}
                              </span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                {mainNav.slice(1).map((item) => {
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
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#ebeef0] px-4 py-3">
        <p className="text-xs text-[#a7abc3]">&copy; 2026 Referrals.com</p>
      </SidebarFooter>
    </Sidebar>
  );
}

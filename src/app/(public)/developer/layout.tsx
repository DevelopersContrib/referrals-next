"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboardIcon,
  CodeIcon,
  PlayIcon,
  BookOpenIcon,
  LifeBuoyIcon,
} from "lucide-react";

const NAV = [
  { href: "/developer", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/developer/docs", label: "API Reference", icon: CodeIcon },
  { href: "/developer/playground", label: "Playground", icon: PlayIcon },
  { href: "/developer/knowledgebase", label: "Knowledgebase", icon: BookOpenIcon },
  { href: "/developer/support", label: "Support", icon: LifeBuoyIcon },
];

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <nav className="sticky top-16 z-40 border-b bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mb-px flex gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </>
  );
}

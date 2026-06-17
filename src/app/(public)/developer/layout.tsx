"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  CodeIcon,
  LifeBuoyIcon,
  PlayIcon,
  KeyIcon,
} from "lucide-react";

const NAV = [
  { href: "/developer", label: "Overview", icon: BookOpenIcon, exact: true },
  { href: "/developer/docs", label: "API Reference", icon: CodeIcon },
  { href: "/developer/playground", label: "Playground", icon: PlayIcon },
  {
    href: "/developer/knowledgebase",
    label: "Knowledgebase",
    icon: KeyIcon,
  },
  { href: "/developer/support", label: "Support", icon: LifeBuoyIcon },
];

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link
              href="/developer"
              className="text-lg font-bold text-gray-900"
            >
              Developer Portal
            </Link>
            <Link
              href="/api-keys"
              className="rounded-lg bg-[#FF5C62] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#ff4f58]"
            >
              Get API Key
            </Link>
          </div>
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-[#FF5C62] text-[#FF5C62]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}

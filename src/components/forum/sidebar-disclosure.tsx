"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Collapses the sidebar on narrow screens, where it sits under the topic list
 * and would otherwise bury the footer. At 900px and up the cards are a real
 * column, so the toggle is hidden and CSS keeps them open regardless of state.
 */
export function SidebarDisclosure({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="forum-sidebar"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between rounded-md border border-border px-4 text-sm font-medium text-gray-900 min-[900px]:hidden"
      >
        {open ? "Hide forum info" : "Categories, digest and more"}
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div
        id="forum-sidebar"
        className={cn(
          open ? "mt-6 block" : "hidden",
          "min-[900px]:mt-0 min-[900px]:block",
        )}
      >
        {children}
      </div>
    </>
  );
}

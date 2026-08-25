"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ScrollableTabsListProps {
  children: ReactNode;
  /** Active tab value — the strip scrolls it into view when it changes. */
  activeValue?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Edge fade for a scrollable strip. Uses a mask rather than a gradient overlay
 * so it works on any page background.
 */
function edgeMask(hasStart: boolean, hasEnd: boolean) {
  if (!hasStart && !hasEnd) return undefined;
  const start = hasStart ? "transparent 0, black 28px" : "black 0";
  const end = hasEnd
    ? "black calc(100% - 28px), transparent 100%"
    : "black 100%";
  return `linear-gradient(to right, ${start}, ${end})`;
}

/**
 * A `TabsList` that scrolls horizontally inside itself instead of wrapping or
 * pushing the page wide. Tab triggers must be `flex-none` to stay full width.
 *
 * Pass `activeValue` when the triggers carry `data-tab-value`, and the selected
 * tab is centered on change — important for deep links on narrow screens.
 *
 * @example
 * <ScrollableTabsList activeValue={value} aria-label="Sections">
 *   <TabsTrigger value="one" data-tab-value="one" className="flex-none">One</TabsTrigger>
 * </ScrollableTabsList>
 */
export function ScrollableTabsList({
  children,
  activeValue,
  className,
  "aria-label": ariaLabel,
}: ScrollableTabsListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  const syncOverflow = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    setOverflow({
      start: list.scrollLeft > 1,
      end: max > 1 && list.scrollLeft < max - 1,
    });
  }, []);

  // Keep the fades honest as the strip is scrolled or the column resizes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    syncOverflow();
    list.addEventListener("scroll", syncOverflow, { passive: true });
    const observer = new ResizeObserver(syncOverflow);
    observer.observe(list);
    return () => {
      list.removeEventListener("scroll", syncOverflow);
      observer.disconnect();
    };
  }, [syncOverflow]);

  // Reveal the selected tab when it sits outside the visible strip. Horizontal
  // only — never yanks the page vertically.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeValue || list.scrollWidth <= list.clientWidth) return;
    const tab = list.querySelector<HTMLElement>(
      `[data-tab-value="${activeValue}"]`,
    );
    if (!tab) return;
    list.scrollTo({
      left: Math.max(
        0,
        tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2,
      ),
      behavior: "smooth",
    });
  }, [activeValue]);

  const mask = edgeMask(overflow.start, overflow.end);

  return (
    <TabsList
      ref={listRef}
      variant="line"
      aria-label={ariaLabel}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className={cn(
        // pb-1.25 lands the active underline on the border below the strip.
        "h-auto w-full min-w-0 max-w-full flex-nowrap justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-none p-0 pb-1.25",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </TabsList>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3Icon,
  UsersIcon,
  GiftIcon,
  MailIcon,
  CodeIcon,
} from "lucide-react";

export const INTEGRATIONS_EMBED_HASH = "integrations/iframe";

export function goToIntegrationsEmbed(event?: { preventDefault(): void }) {
  event?.preventDefault();
  const next = INTEGRATIONS_EMBED_HASH;
  if (window.location.hash.replace(/^#/, "") === next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = next;
  }
  requestAnimationFrame(() => {
    document.getElementById("campaign-tabs")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function IntegrationsEmbedLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`#${INTEGRATIONS_EMBED_HASH}`}
      className={className}
      onClick={goToIntegrationsEmbed}
    >
      {children}
    </a>
  );
}

const TABS = [
  { value: "analytics", label: "Analytics", icon: BarChart3Icon },
  { value: "referrals", label: "Referrals", icon: UsersIcon },
  { value: "rewards", label: "Rewards", icon: GiftIcon },
  { value: "emails", label: "Emails", icon: MailIcon },
  { value: "integrations", label: "Integrations", icon: CodeIcon },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const VALID = new Set<string>(TABS.map((t) => t.value));

interface CampaignTabsProps {
  analytics: ReactNode;
  referrals: ReactNode;
  rewards: ReactNode;
  emails: ReactNode;
  integrations: ReactNode;
}

/**
 * Edge fade for the tab strip. Background-agnostic (mask, not a gradient
 * overlay) so it works over the dashboard's tinted page background.
 */
function edgeMask(hasStart: boolean, hasEnd: boolean) {
  if (!hasStart && !hasEnd) return undefined;
  const start = hasStart ? "transparent 0, black 28px" : "black 0";
  const end = hasEnd
    ? "black calc(100% - 28px), transparent 100%"
    : "black 100%";
  return `linear-gradient(to right, ${start}, ${end})`;
}

export function CampaignTabs({
  analytics,
  referrals,
  rewards,
  emails,
  integrations,
}: CampaignTabsProps) {
  const [value, setValue] = useState<TabValue>("analytics");
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

  // Reveal the selected tab when it sits outside the visible strip (deep links
  // to #integrations land here on narrow screens). Horizontal only — never
  // yanks the page vertically.
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const tab = list.querySelector<HTMLElement>(`[data-tab-value="${value}"]`);
    if (!tab) return;
    const target = tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
    list.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [value]);

  // Deep-link: #integrations or #integrations/iframe (Install / embed → Embed tab).
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, "");
      const tab = hash.split("/")[0];
      if (VALID.has(tab)) setValue(tab as TabValue);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const onValueChange = (v: string) => {
    setValue(v as TabValue);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${v}`);
    }
  };

  const content: Record<TabValue, ReactNode> = {
    analytics,
    referrals,
    rewards,
    emails,
    integrations,
  };

  return (
    <div id="campaign-tabs" className="min-w-0 scroll-mt-20">
      <Tabs value={value} onValueChange={onValueChange} className="min-w-0">
        <div className="min-w-0 border-b border-portlet-border">
          <TabsList
            ref={listRef}
            variant="line"
            aria-label="Campaign sections"
            style={{
              maskImage: edgeMask(overflow.start, overflow.end),
              WebkitMaskImage: edgeMask(overflow.start, overflow.end),
            }}
            // The bottom padding lands the active underline on the border below.
            className="h-auto w-full min-w-0 max-w-full flex-nowrap justify-start gap-1 overflow-x-auto overscroll-x-contain rounded-none p-0 pb-1.25 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  data-tab-value={t.value}
                  className="h-10 flex-none gap-1.5 px-3 data-active:text-brand data-active:after:bg-brand"
                >
                  <Icon className="size-4" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6 min-w-0">
            {content[t.value]}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

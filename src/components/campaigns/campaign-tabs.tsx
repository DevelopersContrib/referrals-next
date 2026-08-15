"use client";

import { useEffect, useState, type ReactNode } from "react";
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

export function CampaignTabs({
  analytics,
  referrals,
  rewards,
  emails,
  integrations,
}: CampaignTabsProps) {
  const [value, setValue] = useState<TabValue>("analytics");

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
    <div id="campaign-tabs">
      <Tabs value={value} onValueChange={onValueChange}>
        <TabsList
          variant="line"
          className="flex flex-wrap gap-1 border-b border-[#ebeef0] pb-0"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <Icon className="size-4" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            {content[t.value]}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

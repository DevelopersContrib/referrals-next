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

  // Deep-link support: /…/campaigns/123#integrations opens that tab.
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (VALID.has(hash)) setValue(hash as TabValue);
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
  );
}

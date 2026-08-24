/**
 * Shared types + the module dependency graph for the AI Brand Intelligence
 * onboarding pipeline. Add a new analyzer by appending to MODULES, wiring its
 * deps here, and registering a runner in registry.ts — nothing else changes.
 */
import type { brand_analysis } from "@prisma/client";

export const MODULES = ["vnoc", "crawl", "social", "intelligence", "campaigns"] as const;
export type ModuleName = (typeof MODULES)[number];

/** First-run onboarding — skip default campaign gen (use /campaigns/ai or brief regen). */
export const ONBOARDING_MODULES = [
  "vnoc",
  "crawl",
  "social",
  "intelligence",
] as const satisfies readonly ModuleName[];

export function isModuleName(v: string): v is ModuleName {
  return (MODULES as readonly string[]).includes(v);
}

/** A module becomes runnable once every dep is done OR failed (soft deps). */
export const MODULE_DEPS: Record<ModuleName, ModuleName[]> = {
  vnoc: [],
  crawl: [],
  social: ["crawl", "vnoc"],
  intelligence: ["crawl", "vnoc"],
  campaigns: ["intelligence"],
};

/** User-facing labels for the animated live checklist. */
export const MODULE_LABELS: Record<ModuleName, { title: string; active: string; done: string }> = {
  vnoc: {
    title: "Brand records",
    active: "Checking our brand network…",
    done: "Brand records checked",
  },
  crawl: {
    title: "Website",
    active: "Reading your website…",
    done: "Website analyzed",
  },
  social: {
    title: "Social profiles",
    active: "Discovering social profiles…",
    done: "Social profiles found",
  },
  intelligence: {
    title: "Brand intelligence",
    active: "Building your brand profile…",
    done: "Brand profile ready",
  },
  campaigns: {
    title: "Referral campaigns",
    active: "Generating referral campaigns…",
    done: "Campaigns generated",
  },
};

export type ModuleStatus = "pending" | "running" | "done" | "failed";
export type JobStatus = "pending" | "running" | "done" | "failed";

/** A runner receives the analysis header and writes its own result table. */
export type ModuleRunner = (analysis: brand_analysis) => Promise<void>;

export interface DiscoveredSocial {
  platform: string;
  url: string;
  source: "vnoc" | "crawl";
  verified?: boolean;
}

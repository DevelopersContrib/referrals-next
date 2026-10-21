import type { Metadata } from "next";
import { NetworkPageIntro } from "@/components/network/network-page-intro";
import { NetworkPlans } from "@/components/network/network-plans";
import { PLAN_CATALOG_COPY, type CatalogPlan } from "@/lib/plan-catalog";
import { prisma } from "@/lib/prisma";
import { networkDesign, requireNetworkSite } from "../site";

type Props = { params: Promise<{ site: string }> };

export const metadata: Metadata = {
  title: "Pricing",
  description: "Set up free. $9/mo or $99/yr per brand when you publish. Agency plans for 10 or 50 brands.",
  alternates: { canonical: "/pricing" },
};

export default async function NetworkPricingPage({ params }: Props) {
  const site = await requireNetworkSite(params);
  const design = await networkDesign(site);
  const plans = (await prisma.plans.findMany({ orderBy: { id: "asc" } })) as CatalogPlan[];

  return (
    <>
      <NetworkPageIntro
        design={design}
        title="Pay when you go live"
        sub={`${PLAN_CATALOG_COPY.trialFootnote} No per-referral fees.`}
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <NetworkPlans site={site} plans={plans} />
      </div>
    </>
  );
}

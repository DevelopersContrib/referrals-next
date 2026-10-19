import { redirect } from "next/navigation";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";

/**
 * Stable checkout entry point: /billing/checkout?brandId=12&goLiveCampaign=34
 *
 * Publish CTAs link here so they never have to name a plan id. `goLiveCampaign`
 * is what flips the campaign public once payment clears, so it is carried
 * through rather than dropped.
 */
export default async function BillingCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ brandId?: string; goLiveCampaign?: string }>;
}) {
  const { brandId, goLiveCampaign } = await searchParams;

  if (!brandId || !/^\d+$/.test(brandId)) {
    redirect("/billing");
  }

  const query = new URLSearchParams({ brandId });
  if (goLiveCampaign && /^\d+$/.test(goLiveCampaign)) {
    query.set("goLiveCampaign", goLiveCampaign);
  }

  redirect(`/billing/plan/${DEFAULT_PAID_PLAN_ID}?${query.toString()}`);
}

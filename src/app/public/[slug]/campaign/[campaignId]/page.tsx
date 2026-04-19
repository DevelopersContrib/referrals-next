import { notFound } from "next/navigation";
import {
  PublicCampaignPageView,
  buildPublicCampaignMetadata,
} from "@/components/campaigns/public-campaign-page";
import { fetchPublicCampaignViewData } from "@/lib/public-campaign-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; campaignId: string }>;
}) {
  const { slug, campaignId } = await params;
  const data = await fetchPublicCampaignViewData(slug, campaignId);
  if (!data) return { title: "Campaign" };
  return buildPublicCampaignMetadata(data);
}

export default async function LegacyStylePublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string; campaignId: string }>;
}) {
  const { slug, campaignId } = await params;
  const data = await fetchPublicCampaignViewData(slug, campaignId);
  if (!data) notFound();
  return <PublicCampaignPageView data={data} />;
}

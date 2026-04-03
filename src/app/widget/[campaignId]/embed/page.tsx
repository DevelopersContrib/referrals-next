import { notFound } from "next/navigation";
import { ReferralWidget } from "@/components/widget/referral-widget";
import { getWidgetData } from "../widget-data";

export const metadata = {};

export default async function WidgetEmbedPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId: rawId } = await params;
  const campaignId = parseInt(rawId, 10);
  if (isNaN(campaignId)) notFound();

  const data = await getWidgetData(campaignId);
  if (!data) notFound();

  return (
    <div style={{ padding: 0, margin: 0 }}>
      <ReferralWidget
        config={data.config}
        reward={data.reward}
        leaderboard={data.leaderboard}
        isEmbed
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { ReferralWidget } from "@/components/widget/referral-widget";
import { getWidgetData } from "./widget-data";

export default async function WidgetPage({
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "#F3F4F6",
      }}
    >
      <ReferralWidget
        config={data.config}
        reward={data.reward}
        leaderboard={data.leaderboard}
      />
    </div>
  );
}

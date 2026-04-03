import { notFound } from "next/navigation";
import { ReferralWidget } from "@/components/widget/referral-widget";
import { getWidgetData } from "../widget-data";

export const metadata = {};

/**
 * Popup modal version of the widget.
 * Rendered in a small window opened by the widget.js loader.
 * Includes a close button and centered layout.
 */
export default async function WidgetPopupPage({
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
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
        <PopupCloseButton />
        <ReferralWidget
          config={data.config}
          reward={data.reward}
          leaderboard={data.leaderboard}
        />
      </div>
    </div>
  );
}

function PopupCloseButton() {
  return (
    <button
      id="rw-popup-close"
      style={{
        position: "absolute",
        top: "-12px",
        right: "-12px",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        border: "2px solid #ffffff",
        backgroundColor: "#374151",
        color: "#ffffff",
        fontSize: "18px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        lineHeight: 1,
        padding: 0,
      }}
      aria-label="Close popup"
    >
      &times;
    </button>
  );
}

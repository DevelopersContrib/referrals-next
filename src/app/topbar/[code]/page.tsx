import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface TopbarPageProps {
  params: Promise<{ code: string }>;
}

export default async function TopbarNotificationPage({ params }: TopbarPageProps) {
  const { code } = await params;

  // code is a campaign id
  const campaignId = parseInt(code, 10);
  if (isNaN(campaignId)) notFound();

  const campaign = await prisma.member_campaigns.findFirst({
    where: { id: campaignId },
  }).catch(() => null);

  if (!campaign) notFound();

  const brand = await prisma.member_urls.findFirst({
    where: { id: campaign.url_id },
  }).catch(() => null);

  if (!brand) notFound();

  const brandName = brand.url || "this brand";
  const campaignName = campaign.name || "their referral campaign";

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #5867dd;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 20px;
            min-height: 50px;
          }
          .message { font-size: 14px; flex: 1; }
          .message strong { font-weight: 600; }
          .cta {
            background: white;
            color: #5867dd;
            border: none;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            text-decoration: none;
            white-space: nowrap;
            margin-left: 12px;
          }
          .close {
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            font-size: 18px;
            cursor: pointer;
            padding: 0 0 0 12px;
            line-height: 1;
          }
        `}</style>
      </head>
      <body>
        <div className="message">
          <strong>{brandName}</strong> is running a referral program! Join{" "}
          <strong>{campaignName}</strong> and earn rewards.
        </div>
        <a
          href={`/p/${brand.slug}/campaign/${campaign.id}`}
          className="cta"
          target="_parent"
        >
          Join Now
        </a>
        <button className="close" onClick={() => (window as Window & typeof globalThis).parent.postMessage("close-topbar", "*")}>
          ×
        </button>
      </body>
    </html>
  );
}

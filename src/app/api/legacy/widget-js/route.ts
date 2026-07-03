import { type NextRequest, NextResponse } from "next/server";
import { buildCampaignWidgetJs } from "@/lib/widget-js";

/**
 * PHP-compat widget loader. Serves:
 *   /widget.js?campaign=123           (new embeds)
 *   /extension/widget.js?key=123      (legacy PHP embeds)
 *   /widget.js?id=123                 (alt param)
 *
 * All shapes resolve to the same generated loader via buildCampaignWidgetJs.
 */
const jsHeaders = {
  "Content-Type": "application/javascript",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Legacy PHP embeds use ?key=; newer embeds use ?campaign= or ?id=.
  const raw =
    searchParams.get("campaign") ||
    searchParams.get("id") ||
    searchParams.get("key");
  const campaignId = raw ? parseInt(raw, 10) : NaN;

  if (!raw || Number.isNaN(campaignId)) {
    return new NextResponse(
      "// Missing or invalid ?campaign= / ?id= / ?key= parameter",
      { status: 400, headers: jsHeaders },
    );
  }

  try {
    const result = await buildCampaignWidgetJs(campaignId);

    if (!result.ok) {
      return new NextResponse(result.message, {
        status: result.status,
        headers: jsHeaders,
      });
    }

    return new NextResponse(result.js, {
      status: 200,
      headers: {
        ...jsHeaders,
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (error) {
    console.error("[legacy/widget-js] Error:", error);
    return new NextResponse("// Internal error", {
      status: 500,
      headers: jsHeaders,
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

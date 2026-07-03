import { type NextRequest, NextResponse } from "next/server";
import { buildCampaignWidgetJs } from "@/lib/widget-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsHeaders = {
  "Content-Type": "application/javascript",
  ...corsHeaders,
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/widget/js/[campaignId]
 *
 * Returns the JavaScript widget loader for a campaign. The display mode
 * (embed / popup / floating / topbar) is resolved from the stored widget
 * template so existing embeds render exactly as they did on the PHP site.
 *
 * Content-Type: application/javascript
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId: rawId } = await params;
  const campaignId = parseInt(rawId, 10);

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
    console.error("[widget/js] Error:", error);
    return new NextResponse("// Internal error", {
      status: 500,
      headers: jsHeaders,
    });
  }
}

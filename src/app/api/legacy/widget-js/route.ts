import { type NextRequest, NextResponse } from "next/server";

/**
 * PHP-compat: /widget.js?campaign=123  or  /extension/widget.js?id=123
 *
 * Internally redirects to the canonical /api/widget/js/{id} handler
 * so we don't duplicate the JS generation logic.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaign") || searchParams.get("id");

  if (!campaignId) {
    return new NextResponse("// Missing ?campaign= or ?id= parameter", {
      status: 400,
      headers: {
        "Content-Type": "application/javascript",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const target = `${origin}/api/widget/js/${encodeURIComponent(campaignId)}`;

  const upstream = await fetch(target, {
    headers: { "User-Agent": "legacy-widget-js-proxy" },
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
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

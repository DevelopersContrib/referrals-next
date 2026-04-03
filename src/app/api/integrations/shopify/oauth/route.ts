import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShopifyIntegration } from "@/lib/integrations/shopify";

/**
 * Handle Shopify OAuth callback.
 * Shopify redirects here with ?code=...&shop=...&state=...
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Redirect to sign in if not authenticated
      return NextResponse.redirect(
        new URL("/signin?callbackUrl=/integrations/shopify", req.url)
      );
    }

    const memberId = parseInt(session.user.id, 10);
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const shop = url.searchParams.get("shop");
    const state = url.searchParams.get("state");

    if (!code || !shop) {
      return NextResponse.redirect(
        new URL("/integrations/shopify?error=missing_params", req.url)
      );
    }

    // Verify state parameter (should match what we stored)
    // In a full implementation, you'd validate this against a session/cookie value
    if (!state) {
      return NextResponse.redirect(
        new URL("/integrations/shopify?error=invalid_state", req.url)
      );
    }

    // Exchange the code for an access token
    const result = await ShopifyIntegration.exchangeOAuthCode(shop, code);

    if (!result.success || !result.data) {
      console.error("Shopify OAuth exchange failed:", result.error);
      return NextResponse.redirect(
        new URL("/integrations/shopify?error=oauth_failed", req.url)
      );
    }

    const shopName = shop.replace(".myshopify.com", "");

    // Find a campaign integration to update, or get the member's first campaign
    const campaigns = await prisma.member_campaigns.findMany({
      where: { member_id: memberId },
      select: { id: true },
      take: 1,
    });

    if (campaigns.length > 0) {
      // Upsert the Shopify integration for the campaign
      const existing = await prisma.campaign_integrations.findFirst({
        where: { campaign_id: campaigns[0].id },
      });

      if (existing) {
        await prisma.campaign_integrations.update({
          where: { id: existing.id },
          data: { shopify_shop_name: shopName },
        });
      } else {
        await prisma.campaign_integrations.create({
          data: {
            campaign_id: campaigns[0].id,
            shopify_shop_name: shopName,
          },
        });
      }
    }

    // Redirect back to the integration settings page
    return NextResponse.redirect(
      new URL("/integrations/shopify?success=true", req.url)
    );
  } catch (error) {
    console.error("Shopify OAuth error:", error);
    return NextResponse.redirect(
      new URL("/integrations/shopify?error=server_error", req.url)
    );
  }
}

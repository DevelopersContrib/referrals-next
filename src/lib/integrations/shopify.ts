import type { Integration, IntegrationResult } from "./base";

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: { id: number; title: string; price: string }[];
  image?: { src: string };
}

interface ShopifyOAuthTokens {
  access_token: string;
  scope: string;
}

/**
 * Shopify API wrapper for the Referrals.com integration.
 * Uses Shopify Admin REST API.
 */
export class ShopifyIntegration implements Integration {
  name = "Shopify";
  private shopName: string;
  private accessToken: string;

  constructor(shopName: string, accessToken: string) {
    this.shopName = shopName.replace(".myshopify.com", "");
    this.accessToken = accessToken;
  }

  private get baseUrl() {
    return `https://${this.shopName}.myshopify.com/admin/api/2024-01`;
  }

  private get headers() {
    return {
      "X-Shopify-Access-Token": this.accessToken,
      "Content-Type": "application/json",
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/shop.json`, {
        headers: this.headers,
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Access token should be revoked via Shopify API and removed from DB
    try {
      await fetch(
        `https://${this.shopName}.myshopify.com/admin/api_permissions/current.json`,
        {
          method: "DELETE",
          headers: this.headers,
        }
      );
    } catch {
      // Best effort
    }
  }

  /**
   * Exchange the OAuth authorization code for an access token
   */
  static async exchangeOAuthCode(
    shopName: string,
    code: string
  ): Promise<IntegrationResult<ShopifyOAuthTokens>> {
    try {
      const cleanShop = shopName.replace(".myshopify.com", "");
      const resp = await fetch(
        `https://${cleanShop}.myshopify.com/admin/oauth/access_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.SHOPIFY_CLIENT_ID,
            client_secret: process.env.SHOPIFY_CLIENT_SECRET,
            code,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        return { success: false, error: err || "OAuth exchange failed" };
      }

      const data = await resp.json();
      return {
        success: true,
        data: {
          access_token: data.access_token,
          scope: data.scope,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build the OAuth authorization URL
   */
  static getOAuthUrl(shopName: string, redirectUri: string, state: string): string {
    const cleanShop = shopName.replace(".myshopify.com", "");
    const scopes = "read_products,read_orders";
    return `https://${cleanShop}.myshopify.com/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  /**
   * Get products from the shop
   */
  async getProducts(
    limit = 50,
    pageInfo?: string
  ): Promise<IntegrationResult<{ products: ShopifyProduct[]; nextPageInfo?: string }>> {
    try {
      let url = `${this.baseUrl}/products.json?limit=${limit}`;
      if (pageInfo) {
        url += `&page_info=${pageInfo}`;
      }

      const resp = await fetch(url, { headers: this.headers });

      if (!resp.ok) {
        const err = await resp.text();
        return { success: false, error: err || "Failed to fetch products" };
      }

      const data = await resp.json();

      // Parse Link header for pagination
      const linkHeader = resp.headers.get("link") || "";
      let nextPageInfo: string | undefined;
      const nextMatch = linkHeader.match(
        /page_info=([^>&]*)[^>]*>;\s*rel="next"/
      );
      if (nextMatch) {
        nextPageInfo = nextMatch[1];
      }

      const products: ShopifyProduct[] = data.products.map(
        (p: Record<string, unknown>) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          status: p.status,
          variants: (p.variants as Record<string, unknown>[])?.map(
            (v: Record<string, unknown>) => ({
              id: v.id,
              title: v.title,
              price: v.price,
            })
          ) || [],
          image: (p.image as Record<string, unknown>)?.src
            ? { src: (p.image as Record<string, unknown>).src as string }
            : undefined,
        })
      );

      return { success: true, data: { products, nextPageInfo } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<IntegrationResult<ShopifyProduct>> {
    try {
      const resp = await fetch(`${this.baseUrl}/products/${productId}.json`, {
        headers: this.headers,
      });

      if (!resp.ok) {
        return { success: false, error: "Product not found" };
      }

      const data = await resp.json();
      return { success: true, data: data.product };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

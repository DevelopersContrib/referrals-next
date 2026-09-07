/**
 * Shopify OAuth smoke (R2).
 *
 * Offline — authorize URL shape only (no secrets):
 *   npx tsx scripts/smoke-shopify-oauth.ts
 *   npx tsx scripts/smoke-shopify-oauth.ts --shop my-store --app-url https://referrals.com
 *
 * Live — credentials from .env.local + URL uses real client id:
 *   npx tsx scripts/smoke-shopify-oauth.ts --live
 */
import { config as loadEnv } from "dotenv";
import {
  ShopifyIntegration,
  buildShopifyAuthorizeUrl,
  normalizeShopifyShop,
  shopifyClientId,
  SHOPIFY_OAUTH_SCOPES,
} from "../src/lib/integrations/shopify";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function validateAuthorizeUrl(
  authUrl: string,
  shop: string,
  expectedClientId: string,
  redirectUri: string,
  state: string,
) {
  let parsed: URL;
  try {
    parsed = new URL(authUrl);
  } catch {
    fail(`authorize URL is not parseable: ${authUrl}`);
  }

  const hostShop = normalizeShopifyShop(shop);
  if (parsed.hostname !== `${hostShop}.myshopify.com`) {
    fail(`unexpected host: ${parsed.hostname}`);
  }
  pass(`host: ${parsed.hostname}`);

  if (parsed.pathname !== "/admin/oauth/authorize") {
    fail(`unexpected path: ${parsed.pathname}`);
  }
  pass("path: /admin/oauth/authorize");

  const clientIdParam = parsed.searchParams.get("client_id");
  if (clientIdParam !== expectedClientId) {
    fail(`client_id param mismatch (got ${clientIdParam})`);
  }
  pass("client_id query param matches");

  const scope = parsed.searchParams.get("scope");
  if (scope !== SHOPIFY_OAUTH_SCOPES) {
    fail(`unexpected scope: ${scope}`);
  }
  pass(`scope: ${scope}`);

  const redirectParam = parsed.searchParams.get("redirect_uri");
  if (redirectParam !== redirectUri) {
    fail(`redirect_uri mismatch: expected ${redirectUri}, got ${redirectParam}`);
  }
  pass(`redirect_uri: ${redirectParam}`);

  if (parsed.searchParams.get("state") !== state) {
    fail("state param missing or wrong");
  }
  pass("state param present");
}

function offline(shop: string, appUrl: string) {
  console.log("\n=== Shopify OAuth smoke (offline) ===\n");

  const redirectUri = `${appUrl}/api/integrations/shopify/oauth`;
  const state = "smoke-test-state";
  const clientId = "offline-smoke-client-id";

  const authUrl = buildShopifyAuthorizeUrl({
    shopName: shop,
    clientId,
    redirectUri,
    state,
  });

  validateAuthorizeUrl(authUrl, shop, clientId, redirectUri, state);

  const viaClass = ShopifyIntegration.getOAuthUrl(shop, redirectUri, state);
  if (!viaClass.includes("client_id=")) {
    fail("ShopifyIntegration.getOAuthUrl returned unexpected URL");
  }
  pass("ShopifyIntegration.getOAuthUrl builds authorize URL");

  console.log("\nAuthorize URL (offline smoke):\n", authUrl, "\n");
}

function live(shop: string, appUrl: string) {
  console.log("\n=== Shopify OAuth smoke (live) ===\n");

  const redirectUri = `${appUrl}/api/integrations/shopify/oauth`;
  const state = "smoke-test-state";

  const serverClientId = shopifyClientId();
  const publicClientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID?.trim() || "";
  const clientSecret =
    process.env.SHOPIFY_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim() ||
    "";

  if (!serverClientId) {
    fail(
      "SHOPIFY_CLIENT_ID is not set (legacy SHOPIFY_API_KEY also accepted). Copy .env.local.example → .env.local",
    );
  }
  pass(`server client id present (${serverClientId.slice(0, 8)}…)`);

  if (!clientSecret) {
    fail("SHOPIFY_CLIENT_SECRET is not set (legacy SHOPIFY_API_SECRET also accepted)");
  }
  pass("client secret present");

  if (!publicClientId) {
    fail(
      "NEXT_PUBLIC_SHOPIFY_CLIENT_ID is not set — required for /integrations/shopify authorize redirect",
    );
  }
  pass(`public client id present (${publicClientId.slice(0, 8)}…)`);

  if (publicClientId !== serverClientId) {
    fail(
      "NEXT_PUBLIC_SHOPIFY_CLIENT_ID must match SHOPIFY_CLIENT_ID (same Shopify app Client ID)",
    );
  }
  pass("public and server client ids match");

  const authUrl = ShopifyIntegration.getOAuthUrl(shop, redirectUri, state);
  validateAuthorizeUrl(authUrl, shop, serverClientId, redirectUri, state);

  console.log("\nAuthorize URL (live smoke):\n", authUrl, "\n");
}

function main() {
  const shop = arg("shop", "smoke-test-store");
  const appUrl = (
    arg("app-url", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  offline(shop, appUrl);

  if (hasFlag("live")) {
    live(shop, appUrl);
  } else {
    console.log("Run with --live to validate .env.local credentials.\n");
  }

  console.log("All checks passed. Add the redirect URI above to your Shopify app if not already.\n");
}

main();

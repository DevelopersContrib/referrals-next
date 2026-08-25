/**
 * Shopify OAuth smoke — credentials + well-formed authorize URL.
 * Does not call Shopify or require a test shop.
 *
 *   npx tsx scripts/smoke-shopify-oauth.ts
 *   npx tsx scripts/smoke-shopify-oauth.ts --shop my-store --app-url https://referrals.com
 */
import { ShopifyIntegration, shopifyClientId } from "../src/lib/integrations/shopify";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function main() {
  const shop = arg("shop", "smoke-test-store");
  const appUrl = (
    arg("app-url", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
  const redirectUri = `${appUrl}/api/integrations/shopify/oauth`;
  const state = "smoke-test-state";

  const serverClientId = shopifyClientId();
  const publicClientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID?.trim() || "";
  const clientSecret =
    process.env.SHOPIFY_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim() ||
    "";

  console.log("\n=== Shopify OAuth smoke ===\n");

  if (!serverClientId) {
    fail(
      "SHOPIFY_CLIENT_ID is not set (legacy SHOPIFY_API_KEY also accepted). Copy .env.local.example → .env.local"
    );
  }
  pass(`server client id present (${serverClientId.slice(0, 8)}…)`);

  if (!clientSecret) {
    fail("SHOPIFY_CLIENT_SECRET is not set (legacy SHOPIFY_API_SECRET also accepted)");
  }
  pass("client secret present");

  if (!publicClientId) {
    fail("NEXT_PUBLIC_SHOPIFY_CLIENT_ID is not set — required for /integrations/shopify authorize redirect");
  }
  pass(`public client id present (${publicClientId.slice(0, 8)}…)`);

  if (publicClientId !== serverClientId) {
    fail(
      "NEXT_PUBLIC_SHOPIFY_CLIENT_ID must match SHOPIFY_CLIENT_ID (same Shopify app Client ID)"
    );
  }
  pass("public and server client ids match");

  const authUrl = ShopifyIntegration.getOAuthUrl(shop, redirectUri, state);

  let parsed: URL;
  try {
    parsed = new URL(authUrl);
  } catch {
    fail(`authorize URL is not parseable: ${authUrl}`);
  }

  if (parsed.hostname !== `${shop.replace(".myshopify.com", "")}.myshopify.com`) {
    fail(`unexpected host: ${parsed.hostname}`);
  }
  pass(`host: ${parsed.hostname}`);

  if (parsed.pathname !== "/admin/oauth/authorize") {
    fail(`unexpected path: ${parsed.pathname}`);
  }
  pass("path: /admin/oauth/authorize");

  const clientIdParam = parsed.searchParams.get("client_id");
  if (clientIdParam !== serverClientId) {
    fail(`client_id param mismatch (got ${clientIdParam})`);
  }
  pass("client_id query param matches");

  const scope = parsed.searchParams.get("scope");
  if (scope !== "read_products,read_orders") {
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

  console.log("\nAuthorize URL (smoke):\n", authUrl, "\n");
  console.log("All checks passed. Add the redirect URI above to your Shopify app if not already.\n");
}

main();

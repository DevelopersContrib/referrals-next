"use client";

import { useState, useEffect } from "react";

export default function ShopifyIntegrationPage() {
  const [shopName, setShopName] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    // Check URL for OAuth callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setMessage({ type: "success", text: "Shopify connected successfully!" });
      setConnected(true);
    } else if (params.get("error")) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing OAuth parameters from Shopify.",
        invalid_state: "Invalid state parameter. Please try again.",
        oauth_failed: "OAuth exchange failed. Please try again.",
        server_error: "Server error during OAuth. Please try again.",
      };
      const errorKey = params.get("error") || "server_error";
      setMessage({
        type: "error",
        text: errorMessages[errorKey] || "An error occurred.",
      });
    }
    setLoading(false);
  }, []);

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName) return;

    const cleanShop = shopName.replace(".myshopify.com", "");
    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = `${window.location.origin}/api/integrations/shopify/oauth`;

    // Store state for validation
    sessionStorage.setItem("shopify_oauth_state", state);

    // Redirect to Shopify OAuth
    const scopes = "read_products,read_orders";
    const clientId = process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID || "";
    const authUrl = `https://${cleanShop}.myshopify.com/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    window.location.href = authUrl;
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">Shopify Integration</h1>
      <p className="mt-2 text-gray-600">
        Connect your Shopify store to create referral campaigns for your
        products.
      </p>

      {/* Status Badge */}
      <div className="mt-6 flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-300"
          }`}
        />
        <span className="text-sm font-medium text-gray-700">
          {connected
            ? `Connected${connectedShop ? ` to ${connectedShop}` : ""}`
            : "Not Connected"}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Connect Form */}
      {!connected && (
        <form onSubmit={handleConnect} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="shop-name"
              className="block text-sm font-medium text-gray-700"
            >
              Shopify Store Name
            </label>
            <div className="mt-1 flex rounded-md">
              <input
                id="shop-name"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="my-store"
                className="block w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                .myshopify.com
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!shopName}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect Shopify
          </button>
        </form>
      )}

      {/* Connected State */}
      {connected && (
        <div className="mt-6">
          <button
            onClick={() => {
              setConnected(false);
              setConnectedShop("");
              setMessage(null);
            }}
            className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100"
          >
            Disconnect Shopify
          </button>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-10 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900">How It Works</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>1. Enter your Shopify store name and click Connect</li>
          <li>2. Authorize Referrals.com in your Shopify admin</li>
          <li>3. Create referral campaigns linked to your Shopify products</li>
          <li>
            4. Track referral sales and reward advocates automatically
          </li>
        </ul>
      </div>

      {/* Requirements */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="font-semibold text-yellow-800">Requirements</h3>
        <ul className="mt-2 space-y-1 text-sm text-yellow-700">
          <li>- Shopify store with at least one published product</li>
          <li>- Store owner or staff permissions to install apps</li>
        </ul>
      </div>
    </div>
  );
}

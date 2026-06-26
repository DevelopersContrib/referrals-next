import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // ── PHP-compat: /widget/signup → /api/widget/signup (etc.) ──
      // The PHP site exposed widget endpoints without the /api prefix.
      // Existing embeds POST to /widget/signup, /widget/share, etc.
      ...[
        "signup",
        "share",
        "click",
        "impression",
        "invite",
        "reward",
        "vote",
      ].map((action) => ({
        source: `/widget/${action}`,
        destination: `/api/widget/${action}`,
      })),

      // ── PHP-compat: /widget.js?campaign=123 → /api/widget/js/123 ──
      // Legacy embed scripts use <script src="/widget.js?campaign=ID">
      { source: "/widget.js", destination: "/api/legacy/widget-js" },

      // ── PHP-compat: /extension/widget.js?id=123 ──
      {
        source: "/extension/widget.js",
        destination: "/api/legacy/widget-js",
      },

      // ── api.referrals.com compat: /v1/* → /api/v1/* ──
      // When api.referrals.com is added as a Vercel domain,
      // requests arrive as /v1/campaigns → rewrite to /api/v1/campaigns
      { source: "/v1/:path*", destination: "/api/v1/:path*" },
    ];
  },

  async redirects() {
    return [
      // ── PHP dashboard route compat ──
      {
        source: "/brand/allbrands",
        destination: "/brands/allbrands",
        permanent: true,
      },
      {
        source: "/brand/edit/:brandId",
        destination: "/brands/:brandId/edit",
        permanent: true,
      },
      {
        source: "/brand/dashboard/:brandId",
        destination: "/brands/:brandId",
        permanent: true,
      },
      {
        source: "/brand",
        destination: "/brands",
        permanent: true,
      },
      {
        source: "/brand/new",
        destination: "/brands/new",
        permanent: true,
      },
      {
        source: "/campaign/edit/:campaignId",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/campaign/dashboard/:campaignId",
        destination: "/dashboard",
        permanent: false,
      },
      // ── /public/{slug}/campaign/{id} → /p/{slug}/campaign/{id} ──
      {
        source: "/public/:slug/campaign/:campaignId",
        destination: "/p/:slug/campaign/:campaignId",
        permanent: true,
      },
      // ── /plans → /pricing ──
      {
        source: "/plans",
        destination: "/pricing",
        permanent: true,
      },
      // ── /knowledgebase → /support ──
      {
        source: "/knowledgebase",
        destination: "/support",
        permanent: true,
      },
      {
        source: "/knowledgebase/:slug",
        destination: "/support/:slug",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-API-Key, Authorization",
          },
        ],
      },
      // CORS for legacy /widget/* paths (rewritten to /api/widget/*)
      {
        source: "/widget/:action(signup|share|click|impression|invite|reward|vote)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.referrals.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

export default nextConfig;

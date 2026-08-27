import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs *before* the filesystem/public check, so this wins
      // over the static public/widget.js. That makes /widget.js?campaign=ID
      // serve the template-aware loader (popup / embed / floating resolved
      // from the campaign's stored widget template) — identical to
      // /extension/widget.js?key=ID and /api/widget/js/ID.
      beforeFiles: [
        { source: "/widget.js", destination: "/api/legacy/widget-js" },
      ],
      afterFiles: [
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

        // ── PHP-compat: /extension/widget.js?key=123 (legacy embeds) ──
        {
          source: "/extension/widget.js",
          destination: "/api/legacy/widget-js",
        },

        // ── PHP-compat: /extension/signup.js?name=&email=&code= ──
        // Conversion pixel placed on the customer's post-signup page.
        {
          source: "/extension/signup.js",
          destination: "/api/legacy/signup-js",
        },

        // ── api.referrals.com compat: /v1/* → /api/v1/* ──
        // When api.referrals.com is added as a Vercel domain,
        // requests arrive as /v1/campaigns → rewrite to /api/v1/campaigns
        { source: "/v1/:path*", destination: "/api/v1/:path*" },
      ],
    };
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
      // CORS for api.referrals.com legacy /v1/* paths (rewritten to /api/v1/*)
      {
        source: "/v1/:path*",
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
        source:
          "/widget/:action(signup|share|click|impression|invite|reward|vote)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      // /widget.js is served by the dynamic loader (see beforeFiles rewrite),
      // which sets its own Content-Type. Only CORS is needed here.
      {
        source: "/widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Full-page campaign embed (/p/{slug}/campaign/{id}) must load in
      // third-party iframes. Scoped to public campaign URLs only — do not
      // apply frame-ancestors * to dashboard or other authenticated routes.
      {
        source: "/p/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/public/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.referrals.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
  },
};

export default nextConfig;

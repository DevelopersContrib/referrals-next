/** Trim trailing slashes for absolute embed URLs. */
export function trimEmbedBase(url: string) {
  return url.replace(/\/+$/, "");
}

export interface CampaignEmbedSnippets {
  root: string;
  campaignId: number;
  js: string;
  iframe: string;
  next: string;
  wordpress: string;
  shopify: string;
  wix: string;
  codeigniter: string;
  react: string;
  webflow: string;
  squarespace: string;
  gtm: string;
  gtmIframeOnly: string;
}

export function buildCampaignEmbedSnippets(
  baseUrl: string,
  campaignId: number
): CampaignEmbedSnippets {
  const root = trimEmbedBase(baseUrl || "https://referrals.com");
  const id = campaignId;

  const js = `<div id="referrals-widget"></div>
<script src="${root}/api/widget/js/${id}" async></script>`;

  const iframe = `<iframe
  src="${root}/widget/${id}/embed"
  title="Referral program"
  width="100%"
  height="560"
  style="border:0;max-width:100%;"
  loading="lazy"
  allow="clipboard-write; clipboard-read"
></iframe>`;

  const next = `"use client";

const WIDGET_SRC = "${root}/widget/${id}/embed";

export function ReferralWidget() {
  return (
    <iframe
      src={WIDGET_SRC}
      title="Referral program"
      width="100%"
      height={560}
      className="max-w-full border-0"
      loading="lazy"
      allow="clipboard-write; clipboard-read"
    />
  );
}`;

  const wordpress = `<!-- WordPress: Custom HTML block, or add to your theme footer -->
${js}`;

  const shopify = `<!-- Shopify: Online Store → Themes → … → Edit code → theme.liquid → before </body> -->
${js}`;

  const wix = `<!-- Wix: Add an "Embed HTML" / Velo element and paste: -->
${iframe}`;

  const codeigniter = `<!-- CodeIgniter 3/4: in application/views/templates/footer.php (or layout) before </body> -->
<?php $campaignId = ${id}; ?>
<div id="referrals-widget"></div>
<script src="<?= base_url('api/widget/js/' . $campaignId) ?>" async></script>
<!-- If base_url() points at your referrals host, use the absolute script URL instead: -->
<!-- <script src="${root}/api/widget/js/${id}" async></script> -->`;

  const react = `// src/components/ReferralWidget.jsx — CRA, Vite, or any React SPA
export function ReferralWidget() {
  const src = "${root}/widget/${id}/embed";
  return (
    <iframe
      src={src}
      title="Referral program"
      width="100%"
      height={560}
      style={{ border: 0, maxWidth: "100%" }}
      loading="lazy"
      allow="clipboard-write; clipboard-read"
    />
  );
}

// In App.jsx (or a page):
// import { ReferralWidget } from "./components/ReferralWidget";
// <ReferralWidget />`;

  const webflow = `<!-- Webflow: Add panel → Embed → "HTML embed" → paste, then Publish.
     Prefer iframe if the Designer strips external <script> tags. -->
${iframe}

<!-- Alternative: JS loader (inline / popup / floating from widget settings) -->
${js}`;

  const squarespace = `<!-- Squarespace 7.1: Edit page → + → Code → paste (Business plan or higher may be required for code blocks on some sites).
     Use iframe for best compatibility. -->
${iframe}`;

  const gtm = `<!-- Google Tag Manager → Tags → New → Custom HTML → paste below
     Trigger: All Pages (or DOM Ready / Consent Initialization if you use consent mode).
     If GTM blocks external scripts, use an iframe-only snippet in Custom HTML instead. -->
${js}`;

  const gtmIframeOnly = `<!-- GTM Custom HTML tag — iframe only (when <script src> is blocked) -->
${iframe}`;

  return {
    root,
    campaignId: id,
    js,
    iframe,
    next,
    wordpress,
    shopify,
    wix,
    codeigniter,
    react,
    webflow,
    squarespace,
    gtm,
    gtmIframeOnly,
  };
}

export function publicCampaignUrl(
  root: string,
  slugOrId: string | number,
  campaignId: number,
  variant: "public" | "p"
) {
  const seg = encodeURIComponent(String(slugOrId).trim());
  const base = trimEmbedBase(root);
  if (variant === "public") {
    return `${base}/public/${seg}/campaign/${campaignId}`;
  }
  return `${base}/p/${seg}/campaign/${campaignId}`;
}

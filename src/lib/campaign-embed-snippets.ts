/** Trim trailing slashes for absolute embed URLs. */
export function trimEmbedBase(url: string) {
  return url.replace(/\/+$/, "");
}

export function publicCampaignUrl(
  root: string,
  slugOrId: string | number,
  campaignId: number,
  variant: "public" | "p" = "p",
) {
  const seg = encodeURIComponent(String(slugOrId).trim());
  const base = trimEmbedBase(root);
  // Canonical URL is always /p/ — /public/ redirects there via next.config.ts
  void variant;
  return `${base}/p/${seg}/campaign/${campaignId}`;
}

export interface CampaignEmbedSnippets {
  root: string;
  campaignId: number;
  /** Canonical public campaign URL, or empty when slug is missing. */
  pageUrl: string;
  /** JavaScript loader — one script tag injects the widget. */
  js: string;
  /** Widget iframe — compact, paste anywhere HTML is accepted. */
  iframe: string;
  /** Full-page iframe — entire public campaign at /p/{slug}/campaign/{id}. */
  fullPage: string;
  /** Node.js (Express) — serve a page that mounts the widget. */
  node: string;
}

function iframeSnippet(
  src: string,
  title: string,
  height: number,
  extraStyle = "",
) {
  return `<iframe
  src="${src}"
  title="${title}"
  width="100%"
  height="${height}"
  style="border:0;width:100%;max-width:100%;${extraStyle}"
  loading="lazy"
  allow="clipboard-write; clipboard-read"
></iframe>`;
}

export function buildCampaignEmbedSnippets(
  baseUrl: string,
  campaignId: number,
  slugOrId?: string | number | null,
): CampaignEmbedSnippets {
  const root = trimEmbedBase(baseUrl || "https://referrals.com");
  const id = campaignId;
  const segment = String(slugOrId ?? "").trim();
  const pageUrl = segment ? publicCampaignUrl(root, segment, id) : "";

  const js = `<div id="referrals-widget"></div>
<script src="${root}/widget.js?campaign=${id}" async></script>`;

  const iframe = iframeSnippet(
    `${root}/widget/${id}/embed`,
    "Referral program",
    560,
  );

  const fullPage = pageUrl
    ? iframeSnippet(pageUrl, "Referral campaign", 900, "min-height:100vh;")
    : "";

  const node = `// Node.js (Express) — serve a page that mounts the referral widget
// 1) npm install express
// 2) node server.js  →  open http://localhost:3000/refer
import express from "express";

const app = express();
const WIDGET_JS = "${root}/widget.js?campaign=${id}";

app.get("/refer", (_req, res) => {
  res.type("html").send(\`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Refer a friend</title></head>
  <body>
    <!-- The widget renders here (embed, popup, or floating per your widget settings) -->
    <div id="referrals-widget"></div>
    <script src="\${WIDGET_JS}" async></script>
  </body>
</html>\`);
});

app.listen(3000, () => console.log("Referral page → http://localhost:3000/refer"));`;

  return {
    root,
    campaignId: id,
    pageUrl,
    js,
    iframe,
    fullPage,
    node,
  };
}

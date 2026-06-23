/** Trim trailing slashes for absolute embed URLs. */
export function trimEmbedBase(url: string) {
  return url.replace(/\/+$/, "");
}

export interface CampaignEmbedSnippets {
  root: string;
  campaignId: number;
  /** JavaScript loader — one script tag injects the widget. */
  js: string;
  /** iframe embed — paste anywhere HTML is accepted. */
  iframe: string;
  /** Node.js (Express) — serve a page that mounts the widget. */
  node: string;
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

  const node = `// Node.js (Express) — serve a page that mounts the referral widget
// 1) npm install express
// 2) node server.js  →  open http://localhost:3000/refer
import express from "express";

const app = express();
const WIDGET_JS = "${root}/api/widget/js/${id}";

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
    js,
    iframe,
    node,
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

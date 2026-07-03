import { prisma } from "@/lib/prisma";

export type WidgetPlacement = "embed" | "popup" | "floating" | "topbar";

/**
 * PHP `CampaignWidgetTemplates` ids → Next.js widget placement mode.
 *
 * Legacy PHP campaigns are identified by a specific `template_id` (2..11) and
 * are authoritative for placement. `template_id` 1 (CUSTOM/default) and null
 * fall back to the `placement` column, which is what the current Next.js
 * widget editor writes (it only ever stores `embed` or `popup`).
 *
 * PHP reference (protected/models/CampaignWidgetTemplates.php):
 *   1 CUSTOM (popup)   2 WIDGET2 (popup)      3 EMBED
 *   4 FLOATING (popup) 5 FORM                 6 POLL
 *   7 PHOTO_VOTING     8 PAGE_TAKE_OVER       9 INFO_BAR
 *   10 VERTICAL_FORM   11 SIMPLE_POPUP
 */
const TEMPLATE_PLACEMENT: Record<number, WidgetPlacement> = {
  2: "popup", // WIDGET2
  3: "embed", // EMBED
  4: "floating", // FLOATING (fixed trigger button)
  5: "embed", // FORM
  6: "embed", // POLL
  7: "embed", // PHOTO_VOTING
  8: "popup", // PAGE_TAKE_OVER
  9: "topbar", // INFO_BAR
  10: "embed", // VERTICAL_FORM
  11: "popup", // SIMPLE_POPUP
};

/**
 * Resolve the widget display mode from the stored template + placement.
 * Legacy `template_id` (2..11) wins; otherwise trust the `placement` column.
 */
export function resolveWidgetPlacement(
  templateId: number | null | undefined,
  placementColumn: string | null | undefined,
): WidgetPlacement {
  if (typeof templateId === "number" && TEMPLATE_PLACEMENT[templateId]) {
    return TEMPLATE_PLACEMENT[templateId];
  }
  return placementColumn === "popup" ? "popup" : "embed";
}

export type WidgetJsResult =
  | { ok: true; js: string }
  | { ok: false; status: number; message: string };

/**
 * Build the embeddable widget loader JS for a campaign.
 *
 * Shared by the canonical `/api/widget/js/[campaignId]` route and the
 * PHP-compat `/api/legacy/widget-js` route (which serves `/widget.js` and
 * `/extension/widget.js`). Both return identical output so existing embeds
 * render the same regardless of URL shape.
 */
export async function buildCampaignWidgetJs(
  campaignId: number,
): Promise<WidgetJsResult> {
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return { ok: false, status: 400, message: "// Invalid campaign ID" };
  }

  const [campaign, widget] = await Promise.all([
    prisma.member_campaigns.findUnique({ where: { id: campaignId } }),
    prisma.campaign_widget.findFirst({ where: { campaign_id: campaignId } }),
  ]);

  if (!campaign) {
    return { ok: false, status: 404, message: "// Campaign not found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com";
  const color = widget?.color || "3B82F6";
  const placement = resolveWidgetPlacement(
    widget?.template_id,
    widget?.placement,
  );
  const popupButtonText = widget?.popup_button_text || "Join Referral Program";
  const popupButtonColor = widget?.popup_button_color || color;
  const popupButtonPosition = widget?.popup_button_position || "bottom-right";
  const widgetWidth = widget?.widget_width || "100%";
  const widgetHeight = widget?.widget_height || "800";

  const js = generateWidgetJs({
    appUrl,
    campaignId,
    placement,
    color,
    popupButtonText,
    popupButtonColor,
    popupButtonPosition,
    widgetWidth,
    widgetHeight,
  });

  return { ok: true, js };
}

function generateWidgetJs(config: {
  appUrl: string;
  campaignId: number;
  placement: WidgetPlacement;
  color: string;
  popupButtonText: string;
  popupButtonColor: string;
  popupButtonPosition: string;
  widgetWidth: string;
  widgetHeight: string;
}): string {
  return `(function(){
  "use strict";
  var currentScript = document.currentScript;
  var cfg = ${JSON.stringify(config)};
  var embedUrl = cfg.appUrl + "/widget/" + cfg.campaignId + "/embed";

  function createIframe(w, h) {
    var f = document.createElement("iframe");
    f.src = embedUrl;
    f.width = w;
    f.style.border = "none";
    f.style.maxWidth = "100%";
    f.setAttribute("frameborder", "0");
    f.setAttribute("scrolling", "no");
    f.setAttribute("allow", "clipboard-write; clipboard-read");
    f.title = "Referral Widget";
    if (h === "auto") {
      f.style.height = "600px";
      window.addEventListener("message", function(e) {
        if (e.data && e.data.type === "rw-resize" && e.source === f.contentWindow) {
          f.style.height = e.data.height + "px";
        }
      });
    } else {
      f.height = h;
    }
    return f;
  }

  function initEmbed() {
    var el = document.getElementById("referrals-widget")
      || (currentScript && currentScript.parentElement)
      || document.body;
    if (!el) return;
    var w = cfg.widgetWidth.match(/^\\d+$/) ? cfg.widgetWidth + "px" : cfg.widgetWidth;
    var container = document.createElement("div");
    container.style.width = w;
    var iframe = createIframe("100%", cfg.widgetHeight);
    container.appendChild(iframe);
    el.appendChild(container);
  }

  function initPopup() {
    var btn = document.createElement("button");
    btn.textContent = cfg.popupButtonText;
    btn.style.cssText = "padding:12px 24px;border-radius:8px;border:none;background:#" + cfg.popupButtonColor + ";color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;";

    var el = document.getElementById("referrals-widget") || document.body;
    el.appendChild(btn);

    btn.addEventListener("click", function() {
      var overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;";

      var wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;width:100%;max-width:500px;border-radius:12px;overflow:hidden;background:#fff;";

      var closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      closeBtn.style.cssText = "position:absolute;top:8px;right:12px;z-index:10;width:32px;height:32px;border-radius:50%;border:none;background:#374151;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;";
      closeBtn.addEventListener("click", function() { document.body.removeChild(overlay); });

      wrapper.appendChild(closeBtn);
      wrapper.appendChild(createIframe("100%", cfg.widgetHeight));
      overlay.appendChild(wrapper);
      overlay.addEventListener("click", function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
      document.body.appendChild(overlay);
    });
  }

  function initFloating() {
    var pos = cfg.popupButtonPosition;
    var posStyle = "position:fixed;z-index:999998;";
    if (pos === "bottom-left") posStyle += "bottom:24px;left:24px;";
    else posStyle += "bottom:24px;right:24px;";

    var trigger = document.createElement("button");
    trigger.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    trigger.style.cssText = posStyle + "width:56px;height:56px;border-radius:50%;border:none;background:#" + cfg.color + ";color:#fff;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;";

    var panel = document.createElement("div");
    var panelPos = pos === "bottom-left" ? "left:24px;" : "right:24px;";
    panel.style.cssText = "position:fixed;bottom:92px;" + panelPos + "z-index:999999;width:380px;max-width:calc(100vw - 48px);border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);background:#fff;display:none;";
    panel.appendChild(createIframe("100%", "520"));

    var isOpen = false;
    trigger.addEventListener("click", function() {
      isOpen = !isOpen;
      panel.style.display = isOpen ? "block" : "none";
    });

    document.body.appendChild(trigger);
    document.body.appendChild(panel);
  }

  function init() {
    if (cfg.placement === "popup") initPopup();
    else if (cfg.placement === "floating" || cfg.placement === "topbar") initFloating();
    else initEmbed();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();`;
}

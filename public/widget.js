/**
 * Referrals.com Widget Loader (~3KB)
 *
 * Usage:
 *   <script src="https://referrals.com/widget.js" data-campaign="123"></script>
 *
 * Data attributes:
 *   data-campaign  (required) - Campaign ID
 *   data-mode      (optional) - "inline" | "popup" | "floating" (default: "inline")
 *   data-width     (optional) - Widget width (default: "100%")
 *   data-height    (optional) - Widget height (default: "600")
 */
(function () {
  "use strict";

  // Find the current script tag to read data attributes
  var scripts = document.querySelectorAll(
    'script[data-campaign][src*="widget"]'
  );
  var script = scripts[scripts.length - 1];
  if (!script) return;

  var campaignId = script.getAttribute("data-campaign");
  if (!campaignId) {
    console.error("[Referrals.com] Missing data-campaign attribute");
    return;
  }

  var mode = script.getAttribute("data-mode") || "inline";
  var width = script.getAttribute("data-width") || "100%";
  var height = script.getAttribute("data-height") || "600";
  var origin =
    script.src.replace(/\/widget\.js.*$/, "") || "https://referrals.com";

  /**
   * Create the iframe element pointing to the embed page.
   */
  function createIframe(src, w, h) {
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.width = w;
    iframe.height = h;
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.maxWidth = "100%";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute(
      "allow",
      "clipboard-write; clipboard-read"
    );
    iframe.setAttribute("loading", "lazy");
    iframe.title = "Referral Widget";
    return iframe;
  }

  /**
   * Inline mode: inject the iframe where the script tag is.
   */
  function initInline() {
    var container = document.createElement("div");
    container.id = "referrals-widget-" + campaignId;
    container.style.width = width.match(/^\d+$/) ? width + "px" : width;

    var src = origin + "/widget/" + campaignId + "/embed";
    var iframe = createIframe(src, "100%", height);
    container.appendChild(iframe);

    // Insert after the script tag
    script.parentNode.insertBefore(container, script.nextSibling);

    // Listen for resize messages from the iframe
    window.addEventListener("message", function (e) {
      if (e.data && e.data.type === "referrals-widget-resize" && e.data.campaignId === campaignId) {
        iframe.height = e.data.height;
      }
    });
  }

  /**
   * Popup mode: show a button that opens the widget in a modal overlay.
   */
  function initPopup() {
    var btn = document.createElement("button");
    btn.textContent = script.getAttribute("data-button-text") || "Join Referral Program";
    btn.style.cssText =
      "padding:12px 24px;border-radius:8px;border:none;background:#3B82F6;" +
      "color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;";
    script.parentNode.insertBefore(btn, script.nextSibling);

    btn.addEventListener("click", function () {
      // Create overlay
      var overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;" +
        "background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;";

      var wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:relative;width:100%;max-width:500px;border-radius:12px;overflow:hidden;background:#fff;";

      // Close button
      var closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      closeBtn.style.cssText =
        "position:absolute;top:8px;right:12px;z-index:10;width:32px;height:32px;" +
        "border-radius:50%;border:none;background:#374151;color:#fff;font-size:20px;" +
        "cursor:pointer;display:flex;align-items:center;justify-content:center;";
      closeBtn.addEventListener("click", function () {
        document.body.removeChild(overlay);
      });

      var src = origin + "/widget/" + campaignId + "/embed";
      var iframe = createIframe(src, "100%", height);

      wrapper.appendChild(closeBtn);
      wrapper.appendChild(iframe);
      overlay.appendChild(wrapper);

      // Close on overlay click
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) document.body.removeChild(overlay);
      });

      // Close on Escape key
      function onEsc(e) {
        if (e.key === "Escape") {
          document.body.removeChild(overlay);
          document.removeEventListener("keydown", onEsc);
        }
      }
      document.addEventListener("keydown", onEsc);

      document.body.appendChild(overlay);
    });
  }

  /**
   * Floating mode: fixed-position button in corner that opens the widget.
   */
  function initFloating() {
    // Floating trigger button
    var trigger = document.createElement("button");
    trigger.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    trigger.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:999998;width:56px;height:56px;" +
      "border-radius:50%;border:none;background:#3B82F6;color:#fff;cursor:pointer;" +
      "box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;" +
      "transition:transform 0.2s;";
    trigger.addEventListener("mouseenter", function () {
      trigger.style.transform = "scale(1.1)";
    });
    trigger.addEventListener("mouseleave", function () {
      trigger.style.transform = "scale(1)";
    });

    // Widget panel
    var panel = document.createElement("div");
    panel.style.cssText =
      "position:fixed;bottom:92px;right:24px;z-index:999999;width:380px;max-width:calc(100vw - 48px);" +
      "border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);" +
      "background:#fff;display:none;";

    var src = origin + "/widget/" + campaignId + "/embed";
    var iframe = createIframe(src, "100%", "520");
    panel.appendChild(iframe);

    var isOpen = false;
    trigger.addEventListener("click", function () {
      isOpen = !isOpen;
      panel.style.display = isOpen ? "block" : "none";
      trigger.innerHTML = isOpen
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    });

    document.body.appendChild(trigger);
    document.body.appendChild(panel);
  }

  // Initialize based on mode
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    switch (mode) {
      case "popup":
        initPopup();
        break;
      case "floating":
        initFloating();
        break;
      case "inline":
      default:
        initInline();
        break;
    }
  }
})();

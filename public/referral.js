/**
 * Referrals.com whole-domain referral tracker (~1KB, no deps).
 *
 * Drop one tag on any network site — no per-link edits:
 *   <script src="https://www.referrals.com/referral.js" data-domain="garagechannel.com" async></script>
 *
 * What it does:
 *  1. Appends `?ref=<data-domain>` to every OUTBOUND link so the destination
 *     brand attributes the referral to this domain (its bridge closes the loop
 *     on signup).
 *  2. On each outbound click, beacons /api/click so the click is logged against
 *     THIS domain's referral campaign and shows on its referrals.com dashboard.
 *
 * `data-domain` is optional — falls back to the current hostname.
 */
(function () {
  "use strict";

  var API = "https://www.referrals.com/api/click";

  var scripts = document.querySelectorAll('script[src*="referral.js"]');
  var tag = scripts[scripts.length - 1];
  var SELF = ((tag && tag.getAttribute("data-domain")) || location.hostname || "")
    .toLowerCase()
    .replace(/^www\./, "");
  if (!SELF) return;

  function host(href) {
    try {
      return new URL(href, location.href).hostname.toLowerCase().replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }

  function isOutbound(a) {
    if (!a || !a.href) return false;
    if (!/^https?:$/.test(a.protocol || "")) return false; // skip mailto:, tel:, #, javascript:
    var h = host(a.href);
    if (!h || h === SELF || h === "referrals.com") return false;
    return true;
  }

  // Attach ?ref=<SELF> so the destination brand can attribute the referral.
  function ref(a) {
    try {
      var u = new URL(a.href, location.href);
      if (!u.searchParams.get("ref")) {
        u.searchParams.set("ref", SELF);
        a.href = u.toString();
      }
    } catch (e) {
      /* leave the link untouched */
    }
  }

  function refAll() {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
      if (isOutbound(links[i])) ref(links[i]);
    }
  }

  function beacon(toHost, url) {
    var q =
      API +
      "?from=" + encodeURIComponent(SELF) +
      "&to=" + encodeURIComponent(toHost) +
      "&url=" + encodeURIComponent(url || "");
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(q)) return;
    } catch (e) {
      /* fall through to pixel */
    }
    try {
      new Image().src = q + "&_=" + Date.now();
    } catch (e) {
      /* give up silently */
    }
  }

  // One delegated, capture-phase listener for the whole page.
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target;
      while (a && a.tagName !== "A") a = a.parentNode;
      if (!a || a.nodeType !== 1 || !isOutbound(a)) return;
      ref(a); // ensure ?ref is present before the browser navigates
      beacon(host(a.href), a.href);
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refAll);
  } else {
    refAll();
  }
})();

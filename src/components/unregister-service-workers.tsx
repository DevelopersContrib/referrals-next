"use client";

import { useEffect } from "react";

/** Drop stale service workers that 404'd /sw.js and broke image fetches. */
export function UnregisterServiceWorkers() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) void reg.unregister();
    });
  }, []);
  return null;
}

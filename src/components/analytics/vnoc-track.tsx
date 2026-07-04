"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    vnoc?: {
      track?: (name: string, category?: string, value?: string) => void;
    };
  }
}

/**
 * Fires a single VNOC Analytics conversion event on mount.
 *
 * The tracker script loads deferred, so `window.vnoc` may not exist yet when
 * this mounts — we poll briefly until it's ready, then fire exactly once.
 * Fully guarded: a tracking hiccup must never break the page.
 */
export function VnocTrack({
  name,
  category,
  value,
}: {
  name: string;
  category?: string;
  value?: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    let attempts = 0;

    const tryFire = () => {
      if (fired.current) return;
      const track = window.vnoc?.track;
      if (typeof track === "function") {
        fired.current = true;
        try {
          track(name, category, value);
        } catch {
          // never surface tracking errors to the user
        }
        return;
      }
      // Retry for ~5s while the deferred tracker script loads.
      if (attempts++ < 25) setTimeout(tryFire, 200);
    };

    tryFire();
  }, [name, category, value]);

  return null;
}

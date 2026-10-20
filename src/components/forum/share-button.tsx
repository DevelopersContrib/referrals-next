"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/**
 * Hands the topic link to the native share sheet where there is one (phones),
 * and falls back to copying it everywhere else.
 */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dismissing the share sheet lands here too, so fall through to copying
        // rather than reporting a failure the reader did not cause.
      }
    }

    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } else {
      toast.error("Could not copy the link. Copy it from the address bar.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      onClick={share}
    >
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

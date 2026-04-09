"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      router.refresh();
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllRead}
      disabled={loading}
    >
      {loading ? "Marking..." : "Mark All as Read"}
    </Button>
  );
}

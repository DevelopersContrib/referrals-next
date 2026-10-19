"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ModerationAction({
  id,
  type,
  action,
  label,
}: {
  id: number;
  type: "topic" | "comment" | "report";
  action: "approve" | "hide" | "resolve";
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      await fetch("/api/admin/forum", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, action }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={action === "hide" ? "outline" : "default"}
      onClick={run}
      disabled={loading}
    >
      {loading ? "Saving…" : label}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReportButton({
  topicId,
  commentId,
}: {
  topicId?: number;
  commentId?: number;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function report() {
    setState("sending");
    try {
      const res = await fetch("/api/forum/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          comment_id: commentId,
          reason: "Spam or abuse",
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return <span className="text-xs text-muted-foreground">Reported</span>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-0 text-xs text-muted-foreground"
      onClick={report}
      disabled={state === "sending"}
    >
      {state === "error" ? "Try again" : "Report"}
    </Button>
  );
}

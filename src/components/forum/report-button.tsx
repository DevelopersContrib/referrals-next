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
      // 44px tall and wide enough to hit on a phone. The padding is cancelled
      // by the matching negative margin, so the label still lines up with the
      // meta text beside it exactly as it did at 18px.
      className="-mx-2 min-h-11 px-2 text-xs text-muted-foreground"
      onClick={report}
      disabled={state === "sending"}
    >
      {state === "error" ? "Try again" : "Report"}
    </Button>
  );
}

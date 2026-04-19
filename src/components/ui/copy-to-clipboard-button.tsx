"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CopyToClipboardButton({
  text,
  className,
  "aria-label": ariaLabel = "Copy to clipboard",
}: {
  text: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [done, setDone] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast.success("Copied");
      setTimeout(() => setDone(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("shrink-0 border-[#ebeef0] hover:border-brand hover:text-brand", className)}
      aria-label={ariaLabel}
      onClick={() => void handleCopy()}
    >
      {done ? <CheckIcon className="size-4 text-emerald-600" /> : <CopyIcon className="size-4" />}
    </Button>
  );
}

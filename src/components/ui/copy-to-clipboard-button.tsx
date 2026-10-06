"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";

export function CopyToClipboardButton({
  text,
  className,
  disabled,
  "aria-label": ariaLabel = "Copy to clipboard",
}: {
  text: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [done, setDone] = useState(false);

  async function handleCopy() {
    if (await copyText(text)) {
      setDone(true);
      toast.success("Copied");
      setTimeout(() => setDone(false), 2000);
    } else {
      toast.error("Could not copy — select the text and press Ctrl+C");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("shrink-0 border-[#ebeef0] hover:border-brand hover:text-brand", className)}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => void handleCopy()}
    >
      {done ? <CheckIcon className="size-4 text-emerald-600" /> : <CopyIcon className="size-4" />}
    </Button>
  );
}

"use client";

import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div className={cn("group/code relative", className)}>
      <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 pr-12 font-mono text-sm leading-relaxed text-green-400">
        {code}
      </pre>
      <CopyToClipboardButton
        text={code}
        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/code:opacity-100 border-white/20 text-white/50 hover:text-white hover:border-white/40 bg-white/10"
        aria-label="Copy code"
      />
    </div>
  );
}

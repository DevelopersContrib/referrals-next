"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free WYSIWYG editor.
 *
 * Uses a contentEditable surface + document.execCommand for basic formatting
 * (bold/italic/underline/lists/links) — matching the PHP platform's simple
 * rich-text toolbar without pulling in a heavy editor dependency.
 *
 * Value is HTML. The surface is uncontrolled (we only write `value` into it
 * when it differs from the live DOM) so the caret never jumps while typing;
 * external updates (e.g. an AI draft) still flow in.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholders,
  minHeight = 180,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Optional quick-insert chips (e.g. ["[name]", "[link]"]). */
  placeholders?: string[];
  minHeight?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value into the surface only when it actually differs from
  // what's already rendered — keeps the caret stable during typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = value || "";
    if (el.innerHTML !== incoming) {
      // Legacy plain-text templates have no markup — preserve their line breaks.
      el.innerHTML = /<[a-z/][^>]*>/i.test(incoming)
        ? incoming
        : incoming.replace(/\n/g, "<br>");
    }
  }, [value]);

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL:", "https://");
    if (url) exec("createLink", url);
  };

  const insert = (text: string) => {
    ref.current?.focus();
    document.execCommand("insertText", false, text);
    emit();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-1 py-1">
        <ToolbarButton title="Bold" onClick={() => exec("bold")}>
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec("italic")}>
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec("underline")}>
          <Underline className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert link" onClick={addLink}>
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}>
          <Eraser className="size-4" />
        </ToolbarButton>

        {placeholders && placeholders.length > 0 ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" />
            {placeholders.map((p) => (
              <button
                key={p}
                type="button"
                title={`Insert ${p}`}
                // preventDefault keeps the editor's selection so the token
                // lands at the caret instead of stealing focus.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(p)}
                className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:bg-brand/10 hover:text-brand"
              >
                {p}
              </button>
            ))}
          </>
        ) : null}
      </div>

      <div
        ref={ref}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        style={{ minHeight }}
        className="w-full px-3 py-2 text-sm leading-relaxed outline-none [&_a]:text-brand [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // Keep the editor selection intact when a button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
    >
      {children}
    </button>
  );
}

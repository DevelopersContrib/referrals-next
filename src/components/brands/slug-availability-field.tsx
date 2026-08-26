"use client";

import { useId } from "react";
import { CheckCircle2, Loader2, AlertCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeSlugInput, PUBLIC_BRAND_HOST } from "@/lib/brand-slug";
import type { SlugAvailability } from "@/hooks/use-slug-availability";

interface SlugAvailabilityFieldProps {
  value: string;
  onChange: (slug: string) => void;
  availability: SlugAvailability;
  label?: string;
  /** Static helper copy shown while there is nothing to report. */
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const TONE = {
  available: "text-emerald-600",
  checking: "text-gray-500",
  taken: "text-[#FF5C62]",
  invalid: "text-[#FF5C62]",
  error: "text-amber-600",
  idle: "text-gray-500",
} as const;

function StatusIcon({ status }: { status: SlugAvailability["status"] }) {
  if (status === "checking") {
    return (
      <Loader2
        aria-hidden
        className="h-4 w-4 animate-spin text-gray-400 motion-reduce:animate-none"
      />
    );
  }
  if (status === "available") {
    return <CheckCircle2 aria-hidden className="h-4 w-4 text-emerald-600" />;
  }
  if (status === "taken" || status === "invalid") {
    return <AlertCircle aria-hidden className="h-4 w-4 text-[#FF5C62]" />;
  }
  return null;
}

/**
 * Public brand address input with live available / taken feedback and a
 * one-click jump to the next free address.
 */
export function SlugAvailabilityField({
  value,
  onChange,
  availability,
  label = "Your public page",
  hint = "This is the address people will visit. You can change it later.",
  placeholder = "your-brand",
  disabled = false,
  className,
}: SlugAvailabilityFieldProps) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const { status, suggestion, message } = availability;
  const hasProblem = status === "taken" || status === "invalid";

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>

      <div
        className={cn(
          "flex items-center gap-1 rounded-xl border bg-white pr-3 transition-colors focus-within:ring-2 focus-within:ring-[#FF5C62]/20",
          hasProblem
            ? "border-[#FF5C62]"
            : status === "available"
              ? "border-emerald-500"
              : "border-[#ebeef0] focus-within:border-[#FF5C62]",
          disabled && "opacity-60",
        )}
      >
        <span className="hidden shrink-0 select-none py-2.5 pl-3 text-sm text-gray-400 sm:inline">
          {PUBLIC_BRAND_HOST}/p/
        </span>
        <span className="shrink-0 select-none py-2.5 pl-3 text-sm text-gray-400 sm:hidden">
          /p/
        </span>
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(normalizeSlugInput(e.target.value))}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          aria-invalid={hasProblem}
          aria-describedby={statusId}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400"
        />
        <StatusIcon status={status} />
      </div>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={cn("text-sm", TONE[status])}
      >
        {message || hint}
      </p>

      {suggestion && suggestion !== value && (
        <button
          type="button"
          onClick={() => onChange(suggestion)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#926efb]/30 bg-[#926efb]/5 px-3 py-1.5 text-xs font-semibold text-[#7c5ce0] transition hover:border-[#926efb]/60 hover:bg-[#926efb]/10 disabled:opacity-60"
        >
          <Wand2 aria-hidden className="h-3.5 w-3.5" />
          Use {suggestion}
        </button>
      )}
    </div>
  );
}

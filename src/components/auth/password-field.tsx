"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Password input with a Show/Hide toggle that survives browser autofill.
 *
 * Chrome fills saved credentials without firing an input event, so `value`
 * stays empty while the DOM holds the real password. Toggling the input's
 * `type` makes React reconcile the element, and React writes its own empty
 * `value` back over the browser's — wiping the field instead of revealing it.
 * Adopting the DOM value before any such render keeps the two in sync.
 */
export function PasswordField({
  value,
  onValueChange,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function adoptBrowserValue() {
    const el = inputRef.current;
    if (el && el.value !== value) onValueChange(el.value);
  }

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onAnimationStart={(e) => {
          if (e.animationName === "autofill-start") adoptBrowserValue();
        }}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => {
          // Chrome withholds an autofilled value from scripts until the page
          // has been interacted with, so this click may be the first chance to
          // read it — take it before the toggle triggers a render.
          adoptBrowserValue();
          setVisible((v) => !v);
        }}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-500 hover:text-gray-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

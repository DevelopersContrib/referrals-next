/**
 * Copy text to the clipboard, reporting whether it actually worked.
 *
 * `navigator.clipboard` is only exposed in a secure context. On a plain-HTTP
 * origin — a LAN IP while testing on a phone, an HTTP-only staging box — the
 * whole API is `undefined`, so reading `.writeText` off it throws and the
 * button appears dead. The `execCommand` path is deprecated but is the only
 * thing that still copies there, so it stands in as the fallback.
 *
 * Callers must branch on the result rather than assuming success; reporting
 * "Copied" when nothing reached the clipboard is worse than reporting failure.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied, or blocked because the document wasn't focused. Fall through.
    }
  }

  return copyViaExecCommand(text);
}

function copyViaExecCommand(text: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  // Must stay rendered and selectable — `display: none` cannot be selected —
  // while staying out of sight and not scrolling the page on focus.
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    // Putting the user's own selection back, since we just stole it.
    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
}

"use client";

/** The topbar renders inside an iframe on the customer's site; the parent page
 *  listens for this message to remove it. */
export function CloseButton() {
  return (
    <button
      className="close"
      onClick={() => window.parent.postMessage("close-topbar", "*")}
    >
      ×
    </button>
  );
}

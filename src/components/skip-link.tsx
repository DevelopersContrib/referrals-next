export const MAIN_CONTENT_ID = "main-content";

/**
 * First stop in the tab order, so a keyboard user can jump the header, the
 * nav menus and anything else a layout mounts ahead of the page itself.
 * Hidden until focused, per the usual convention.
 *
 * Every visual style is a focus: variant deliberately. `not-sr-only` resets
 * padding to 0, so padding set on the base class is wiped the moment the link
 * appears, which collapsed it to a 20px sliver. Fixed rather than absolute so
 * it stays on screen when the page is already scrolled.
 *
 * The matching <main> needs id={MAIN_CONTENT_ID} and tabIndex={-1}; without
 * the tabindex most browsers scroll to the target but leave focus behind,
 * so the next Tab drops the reader straight back into the header.
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-gray-900 focus:shadow-lg focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}

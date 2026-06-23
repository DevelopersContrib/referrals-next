"use client";

import { useState } from "react";

/**
 * Brand logo with graceful fallback chain:
 *   1. the brand's stored logo_url (if set)
 *   2. https://www.brandidentity.com/logo/<domain> — serves logos for VNOC
 *      domains, so "if the brand is in VNOC" is handled implicitly
 *   3. a letter avatar (first char of the domain)
 *
 * Each source falls through to the next via the <img> onError handler.
 */
export function BrandLogo({
  domain,
  logoUrl,
  imgClassName,
  fallbackClassName,
}: {
  domain: string;
  logoUrl?: string | null;
  imgClassName?: string;
  fallbackClassName?: string;
}) {
  const cleanDomain = (domain || "").replace(/^www\./, "");
  const dbLogo = logoUrl && logoUrl !== "0" ? logoUrl : null;
  const biLogo = cleanDomain
    ? `https://www.brandidentity.com/logo/${cleanDomain}`
    : null;
  const sources = [dbLogo, biLogo].filter(Boolean) as string[];

  const [idx, setIdx] = useState(0);

  if (sources.length === 0 || idx >= sources.length) {
    return (
      <div className={fallbackClassName}>
        {cleanDomain ? cleanDomain.charAt(0).toUpperCase() : "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt={`${cleanDomain} logo`}
      className={imgClassName}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

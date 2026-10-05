"use client";

import { useState } from "react";
import { BLOG_IMAGE_FALLBACK } from "@/lib/blog-image";

type BlogImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Cover image for a blog post, falling back to a branded placeholder.
 *
 * Without the fallback a cover that fails to load leaves the bare container
 * showing — an empty grey box with no indication anything is missing.
 *
 * Stays a plain <img> rather than next/image because posts written before
 * covers were self-hosted still point at external hosts that are not listed
 * in `images.remotePatterns`, and next/image throws on those.
 */
export function BlogImage({
  src,
  alt,
  className,
  loading = "lazy",
}: BlogImageProps) {
  // Track which src failed, so reusing this component for a different post
  // does not inherit the previous post's failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolved = src && failedSrc !== src ? src : BLOG_IMAGE_FALLBACK;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => src && setFailedSrc(src)}
    />
  );
}

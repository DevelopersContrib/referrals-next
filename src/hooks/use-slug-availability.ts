"use client";

import { useEffect, useState } from "react";
import {
  normalizeSlug,
  publicBrandPath,
  slugIssue,
  slugIssueMessage,
  type SlugCheckResult,
} from "@/lib/brand-slug";

export type SlugStatus =
  "idle" | "invalid" | "checking" | "available" | "taken" | "error";

export interface SlugAvailability {
  status: SlugStatus;
  /** Normalized slug the status refers to. */
  slug: string;
  message: string;
  /** Next free slug when the current one cannot be used. */
  suggestion: string | null;
  publicPath: string;
}

const DEBOUNCE_MS = 400;

const IDLE: SlugAvailability = {
  status: "idle",
  slug: "",
  message: "",
  suggestion: null,
  publicPath: "",
};

/**
 * Live availability for a brand slug.
 *
 * Shape problems (too short, reserved, numbers only) resolve locally so typing
 * stays instant; only "is anyone else using this" hits the server, debounced and
 * with stale responses discarded.
 */
export function useSlugAvailability(
  slug: string,
  options: { excludeBrandId?: number; enabled?: boolean } = {},
): SlugAvailability {
  const { excludeBrandId, enabled = true } = options;
  const normalized = normalizeSlug(slug);
  const [result, setResult] = useState<SlugAvailability>(IDLE);

  useEffect(() => {
    if (!enabled || !normalized) {
      setResult(IDLE);
      return;
    }

    const issue = slugIssue(normalized);
    if (issue) {
      setResult({
        status: "invalid",
        slug: normalized,
        message: slugIssueMessage(issue),
        suggestion: null,
        publicPath: publicBrandPath(normalized),
      });
      return;
    }

    setResult((prev) => ({
      ...prev,
      status: "checking",
      slug: normalized,
      message: "Checking availability…",
    }));

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug: normalized });
        if (excludeBrandId) {
          params.set("excludeBrandId", String(excludeBrandId));
        }
        const res = await fetch(`/api/brands/check-slug?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("check failed");

        const data = (await res.json()) as SlugCheckResult;
        setResult({
          status: data.available
            ? "available"
            : data.reason === "taken"
              ? "taken"
              : "invalid",
          slug: data.slug,
          message: data.message,
          suggestion: data.suggestion,
          publicPath: data.publicPath,
        });
      } catch {
        if (controller.signal.aborted) return;
        setResult({
          status: "error",
          slug: normalized,
          message: "Could not check that address. We'll confirm on save.",
          suggestion: null,
          publicPath: publicBrandPath(normalized),
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [normalized, excludeBrandId, enabled]);

  return result;
}

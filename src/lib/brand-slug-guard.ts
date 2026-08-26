import { NextResponse } from "next/server";
import { checkBrandSlug } from "@/lib/brand-access";

export type BrandSlugGuard =
  { ok: true; slug: string } | { ok: false; response: NextResponse };

/**
 * Refuse a member-supplied slug the server cannot honour.
 *
 * `{ ok: true, slug: "" }` means no slug was requested — the caller should fall
 * back to `claimBrandSlug`. Responses carry the next free slug so the client can
 * offer a one-click fix instead of a dead end.
 */
export async function guardBrandSlug(input: {
  slug?: string | null;
  website?: string | null;
  excludeBrandId?: number;
}): Promise<BrandSlugGuard> {
  const requested = String(input.slug ?? "").trim();
  if (!requested) return { ok: true, slug: "" };

  const check = await checkBrandSlug({
    slug: requested,
    website: input.website,
    excludeBrandId: input.excludeBrandId,
  });
  if (check.available) return { ok: true, slug: check.slug };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: check.message,
        code: check.reason === "taken" ? "SLUG_TAKEN" : "SLUG_INVALID",
        slug: check.slug,
        suggestion: check.suggestion,
      },
      { status: check.reason === "taken" ? 409 : 400 },
    ),
  };
}

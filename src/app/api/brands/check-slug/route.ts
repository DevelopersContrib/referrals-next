import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkBrandSlug } from "@/lib/brand-access";
import { rateLimit } from "@/lib/rate-limit";

/** Typing a URL fires one check per debounce window; this only stops abuse. */
const CHECK_LIMIT = 60;
const CHECK_WINDOW_MS = 60_000;

function parseBrandId(value: unknown): number | undefined {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function respond(input: {
  slug?: string | null;
  website?: string | null;
  excludeBrandId?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !rateLimit(`check-slug:${session.user.id}`, CHECK_LIMIT, CHECK_WINDOW_MS)
  ) {
    return NextResponse.json(
      { error: "Too many checks. Try again in a moment." },
      { status: 429 },
    );
  }

  const result = await checkBrandSlug(input);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

// GET /api/brands/check-slug?slug=acme-com&website=acme.com&excludeBrandId=12
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  return respond({
    slug: params.get("slug"),
    website: params.get("website"),
    excludeBrandId: parseBrandId(params.get("excludeBrandId")),
  });
}

export async function POST(req: NextRequest) {
  let body: { slug?: string; website?: string; excludeBrandId?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  return respond({
    slug: body.slug,
    website: body.website,
    excludeBrandId: parseBrandId(body.excludeBrandId),
  });
}

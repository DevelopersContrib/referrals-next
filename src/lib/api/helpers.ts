import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Authenticate a request using an API key from the X-API-Key header.
 * Returns the member_id (userid) if valid, or null if invalid/missing.
 */
export async function authenticateApiKey(req: NextRequest): Promise<number | null> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;

  const key = await prisma.member_keys.findFirst({
    where: { api_key: apiKey },
  });
  if (!key) return null;

  return key.userid;
}

/**
 * Standard JSON success response
 */
export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, {
    status,
    headers: corsHeaders(),
  });
}

/**
 * Standard JSON error response
 */
export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, {
    status,
    headers: corsHeaders(),
  });
}

/**
 * CORS headers for public API
 */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  };
}

/**
 * Standard OPTIONS handler for CORS preflight
 */
export function handleCors() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Parse a numeric route param. Returns null for anything that isn't a positive
 * integer, so callers can answer 404 instead of handing NaN to Prisma — which
 * throws a validation error and surfaces as a 500.
 */
export function parseId(value: string | undefined | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Read a JSON body without letting a malformed payload become a 500.
 * Callers answer with invalidJsonError() when ok is false.
 */
export async function readJsonBody(req: NextRequest) {
  try {
    return { ok: true as const, body: await req.json() };
  } catch {
    return { ok: false as const, body: null };
  }
}

/** Standard 400 for an unparseable JSON body. */
export function invalidJsonError() {
  return apiError("Invalid JSON body", 400);
}

/**
 * Parse pagination params from request
 */
export function getPagination(req: NextRequest) {
  const url = new URL(req.url);
  // parseInt returns NaN for junk like ?limit=abc, and NaN survives Math.min /
  // Math.max — it would reach Prisma's take/skip and throw a 500.
  const asInt = (raw: string | null, fallback: number) => {
    const n = parseInt(raw || "", 10);
    return Number.isFinite(n) ? n : fallback;
  };
  const page = Math.max(1, asInt(url.searchParams.get("page"), 1));
  const limit = Math.min(100, Math.max(1, asInt(url.searchParams.get("limit"), 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Authenticate cron job requests via CRON_SECRET
 */
export function authenticateCron(req: NextRequest): boolean {
  const cronSecret = req.headers.get("authorization");
  return cronSecret === `Bearer ${process.env.CRON_SECRET}`;
}

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
 * Parse pagination params from request
 */
export function getPagination(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
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

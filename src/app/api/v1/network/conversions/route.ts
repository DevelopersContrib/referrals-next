import { NextRequest } from "next/server";
import {
  apiSuccess,
  apiError,
  handleCors,
} from "@/lib/api/helpers";
import {
  authenticateNetworkWriteKey,
  networkWriteKeyConfigured,
} from "@/lib/network-auth";
import {
  recordNetworkConversion,
  resolveNetworkRef,
} from "@/lib/network-conversion";

export async function OPTIONS() {
  return handleCors();
}

export async function GET() {
  return apiError("Method not allowed", 405);
}

export async function PUT() {
  return apiError("Method not allowed", 405);
}

export async function DELETE() {
  return apiError("Method not allowed", 405);
}

/**
 * POST /api/v1/network/conversions
 *
 * Network conversion relay for target-site landers after a /t/ hop (?ref= participant id).
 * Auth: NETWORK_WRITE_KEY (or NETWORK_READ_KEY). Not a member ref_* key.
 */
export async function POST(req: NextRequest) {
  try {
    if (!networkWriteKeyConfigured()) {
      return apiError("Network conversion API is not configured", 401);
    }

    const apiKey = req.headers.get("x-api-key");
    if (!authenticateNetworkWriteKey(apiKey)) {
      return apiError("Invalid or missing network key", 401);
    }

    let body: {
      email?: string;
      name?: string;
      ref?: string | number;
      domain?: string;
      ip?: string;
    };
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const email = String(body.email || "").trim();
    const name = String(body.name || "").trim();
    if (!email) return apiError("email is required", 400);
    if (!name) return apiError("name is required", 400);
    if (body.ref === undefined || body.ref === null || body.ref === "") {
      return apiError("ref is required", 400);
    }

    const resolved = await resolveNetworkRef(body.ref);
    if (!resolved) {
      return apiError("Invalid ref", 400);
    }

    const result = await recordNetworkConversion({
      email,
      name,
      resolved,
      domain: body.domain?.trim() || undefined,
      ip: body.ip ?? null,
    });

    if (!result.ok) {
      if (result.error === "domain_mismatch") {
        return apiError("Domain does not match campaign brand", 400);
      }
      if (result.error === "incompatible_campaign") {
        return apiError("Campaign is not eligible for signup conversions", 400);
      }
      return apiError("Invalid ref", 400);
    }

    const status = result.created ? 201 : 200;
    return apiSuccess(
      {
        id: result.participantId,
        message: result.message,
        reward: result.reward?.referrer ?? null,
      },
      status,
    );
  } catch (error) {
    console.error("[v1.network.conversions] failed:", error);
    return apiError("Internal server error", 500);
  }
}

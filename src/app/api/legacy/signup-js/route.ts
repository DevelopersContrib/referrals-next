import { type NextRequest, NextResponse } from "next/server";
import { decryptShareCode } from "@/lib/encryption";

/**
 * PHP-compat conversion pixel. Serves the legacy:
 *   /extension/signup.js?name=&email=&code=<ref-code>
 *
 * Customers put this on their own post-signup / thank-you page (for
 * signup-goal campaigns) to record a referred signup and attribute it to the
 * referrer. The referral `code` is carried in the page URL from the share link.
 *
 * PHP reference: WidgetController::actionSignup(). It decoded a base64
 * `campaign:social:participant:invited` code, recorded the signup, checked the
 * referrer's goal, and returned `console.log("success")`. We reuse the tested
 * POST /api/widget/signup pipeline (attribution + goal + reward + integrations)
 * so a pixel signup is treated identically to a widget signup.
 *
 * The endpoint ALWAYS returns valid JavaScript with 200 so it can never break
 * the customer's page, exactly like the PHP handler.
 */

const jsHeaders = {
  "Content-Type": "application/javascript",
  "Access-Control-Allow-Origin": "*",
};

function jsResponse(message = "success") {
  return new NextResponse(`console.log(${JSON.stringify(message)});`, {
    status: 200,
    headers: jsHeaders,
  });
}

interface DecodedRefCode {
  campaignId: number;
  socialType: number;
  participantId: number;
}

function parseColonCode(decoded: string): DecodedRefCode | null {
  // Expected: campaign:social:participant[:invited] — digits/colons only.
  if (!/^\d+:\d*:\d+(:\d+)?$/.test(decoded)) return null;
  const parts = decoded.split(":");
  const campaignId = parseInt(parts[0], 10);
  const social = parts[1] ? parseInt(parts[1], 10) : 1;
  const participantId = parseInt(parts[2], 10);
  if (!campaignId || !participantId) return null;
  return {
    campaignId,
    socialType: Number.isNaN(social) ? 1 : social,
    participantId,
  };
}

/**
 * Decode a referral tracking code.
 * Legacy PHP links use base64("campaign:social:participant:invited").
 * Next.js /t/ links use AES (decryptShareCode). Try legacy base64, then AES.
 */
function decodeReferralCode(code: string): DecodedRefCode | null {
  try {
    const normalized = code.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    const parsed = parseColonCode(decoded);
    if (parsed) return parsed;
  } catch {
    // fall through to AES attempt
  }

  try {
    const parsed = parseColonCode(decryptShareCode(code));
    if (parsed) return parsed;
  } catch {
    // not decodable
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim();
  const name = (searchParams.get("name") || "").trim();
  const code = searchParams.get("code") || "";

  // Match PHP: silently no-op on invalid input (never error the host page).
  if (!email || !code) return jsResponse();
  if (email.toLowerCase().includes(".ru")) return jsResponse();

  const decoded = decodeReferralCode(code);
  if (!decoded) return jsResponse();

  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const forwardHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const xff = request.headers.get("x-forwarded-for");
    const referer = request.headers.get("referer");
    if (xff) forwardHeaders["x-forwarded-for"] = xff;
    if (referer) forwardHeaders["referer"] = referer;

    const res = await fetch(`${appUrl}/api/widget/signup`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({
        campaignId: decoded.campaignId,
        email,
        name: name || undefined,
        referrerId: decoded.participantId,
      }),
    });

    if (!res.ok) {
      console.error(
        "[legacy/signup-js] signup pipeline returned",
        res.status,
      );
    }
  } catch (error) {
    console.error("[legacy/signup-js] Error:", error);
  }

  return jsResponse();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

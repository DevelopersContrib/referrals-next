import { NextRequest } from "next/server";
import { goReferralRedirect } from "@/lib/go-referral";

/**
 * Legacy PHP hop: GET /go?url=<dest>&ref=<referrer-domain>
 *
 * Example still used on the network:
 *   /go?url=https://beta.referrals.com/signup&ref=hotcredits.com
 *
 * Credits `ref` the same way /go/<domain> does, then 302s to `url` when it is
 * a referrals.com destination (otherwise /signup).
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  return goReferralRedirect(sp.get("ref") || "", sp.get("url"));
}

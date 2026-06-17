import { prisma } from "@/lib/prisma";

export async function logApiCall(
  apiKey: string,
  call: string,
  req: Request
) {
  try {
    const referer = req.headers.get("referer") || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    await prisma.api_call_history.create({
      data: {
        api_key: apiKey,
        call,
        call_from: referer,
        call_from_ip: ip,
      },
    });
  } catch {
    // Non-critical — don't fail the request if logging fails
  }
}

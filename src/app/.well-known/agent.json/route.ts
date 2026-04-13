import { NextResponse } from "next/server";
import { agentCapabilities } from "@/lib/agentCapabilities";

const defaultBaseUrl = "https://referrals.com";

function normalizeBaseUrl(value?: string) {
  if (!value) return defaultBaseUrl;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function GET() {
  const baseUrl = normalizeBaseUrl(
    process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  );
  const payload = {
    name: process.env.DOMAIN_NAME || "Referrals.com",
    description:
      process.env.SITE_DESCRIPTION ||
      "Referral marketing platform for campaigns, rewards, and growth.",
    url: baseUrl,
    version: "1.0",
    capabilities: agentCapabilities,
    authentication: {
      type: "none",
    },
    provider: {
      name: "VNOC / VentureBuilder",
      url: "https://vnoc.com",
    },
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}


/**
 * Page views from VNOC Analytics (analytics.vnoc.com), the tracker every
 * network site loads. Read-only; used by the admin Domains page.
 *
 * Off until VNOC_ANALYTICS_KEY is set (Bearer key for the stats API). A slow
 * or failing API never breaks a page: lookups return null.
 */
const BASE = (process.env.VNOC_ANALYTICS_URL || "https://analytics.vnoc.com").replace(/\/$/, "");
const TIMEOUT_MS = 8_000;

export type DomainTraffic = { pageviews: number; visitors: number };

export function vnocAnalyticsEnabled(): boolean {
  return Boolean((process.env.VNOC_ANALYTICS_KEY || "").trim());
}

/** Page views and unique visitors for one domain over "7d", "30d", ... */
export async function domainTraffic(domain: string, period = "30d"): Promise<DomainTraffic | null> {
  const key = (process.env.VNOC_ANALYTICS_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetch(
      `${BASE}/api/stats?domain=${encodeURIComponent(domain)}&period=${encodeURIComponent(period)}`,
      {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const raw = (await res.json()) as Record<string, unknown>;
    return {
      pageviews: Number(raw.pageviews ?? raw.total_pageviews ?? 0),
      visitors: Number(raw.unique_visitors ?? raw.total_visitors ?? 0),
    };
  } catch {
    return null;
  }
}

import type { EngagementConfig, EngagementStore, FetchVnocStepsFn } from "./types";

export async function syncStepsFromVnoc(
  config: EngagementConfig,
  store: EngagementStore,
  fetchSteps: FetchVnocStepsFn
): Promise<{ ok: true; upserted: number } | { ok: false; error: string }> {
  if (config.enabled === false) return { ok: false, error: "engagement disabled" };
  if (!config.vnocCampaignId) return { ok: false, error: "missing vnocCampaignId" };

  try {
    const rows = await fetchSteps(config.vnocCampaignId, config.domainId);
    const steps = rows.map((r, idx) => ({
      domainKey: config.domainKey,
      campaignKey: config.campaignKey,
      vnocMailId: r.mailId,
      stepOrder: idx,
      delayDays: r.delayDays,
      subject: r.subject,
      bodyHtml: r.bodyHtml,
      enabled: r.enabled,
    }));
    const upserted = await store.upsertSteps(steps);
    return { ok: true, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[engagement] sync failed", config.domainKey, msg);
    return { ok: false, error: msg };
  }
}

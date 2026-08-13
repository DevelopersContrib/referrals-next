import type { EngagementConfig, EngagementStore } from "./types";

export async function enrollUser(
  config: EngagementConfig,
  store: EngagementStore,
  userId: number,
  context?: Record<string, unknown>
): Promise<{ ok: true; enrollmentId: number; created: boolean } | { ok: false; error: string }> {
  if (config.enabled === false) return { ok: false, error: "engagement disabled" };
  if (!Number.isFinite(userId) || userId <= 0) return { ok: false, error: "invalid userId" };

  try {
    const existing = await store.getEnrollment(config.domainKey, userId, config.campaignKey);
    if (existing) {
      if (existing.status === "cancelled" || existing.status === "completed") {
        // Re-enroll only if still active path needed — leave completed alone.
        return { ok: true, enrollmentId: existing.id, created: false };
      }
      return { ok: true, enrollmentId: existing.id, created: false };
    }

    const steps = await store.listSteps(config.domainKey, config.campaignKey);
    const firstDelay = steps[0]?.delayDays ?? 0;
    const nextAt = new Date(Date.now() + Math.max(0, firstDelay) * 86400000);

    const enrollment = await store.upsertEnrollment({
      domainKey: config.domainKey,
      userId,
      campaignKey: config.campaignKey,
      status: "active",
      currentStep: 0,
      nextAt,
      contextJson: context ? JSON.stringify(context) : null,
    });

    return { ok: true, enrollmentId: enrollment.id, created: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[engagement] enroll failed", config.domainKey, userId, msg);
    return { ok: false, error: msg };
  }
}

export async function cancelEnrollment(
  config: EngagementConfig,
  store: EngagementStore,
  userId: number
): Promise<void> {
  const existing = await store.getEnrollment(config.domainKey, userId, config.campaignKey);
  if (!existing || existing.status !== "active") return;
  await store.updateEnrollment(existing.id, {
    status: "cancelled",
    nextAt: null,
    completedAt: new Date(),
  });
}

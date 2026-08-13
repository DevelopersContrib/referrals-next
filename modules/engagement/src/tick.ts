import { applyTokens, htmlToText } from "./tokens";
import type {
  EngagementConfig,
  EngagementStore,
  LoadUserFn,
  SendEmailFn,
  ShouldSkipStepFn,
} from "./types";

export type TickResult = {
  processed: number;
  sent: number;
  skipped: number;
  completed: number;
  errors: number;
};

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86400000;
}

export async function tickEnrollments(
  config: EngagementConfig,
  store: EngagementStore,
  loadUser: LoadUserFn,
  sendEmail: SendEmailFn,
  shouldSkipStep?: ShouldSkipStepFn,
  opts: { limit?: number } = {}
): Promise<TickResult> {
  const result: TickResult = { processed: 0, sent: 0, skipped: 0, completed: 0, errors: 0 };
  if (config.enabled === false) return result;

  const steps = (await store.listSteps(config.domainKey, config.campaignKey)).filter((s) => s.enabled);
  if (!steps.length) return result;

  const due = await store.listDueEnrollments(config.domainKey, config.campaignKey, opts.limit ?? 50);
  const minDays = config.minDaysBetweenSends ?? 3;

  for (const enrollment of due) {
    result.processed += 1;
    const step = steps[enrollment.currentStep];
    if (!step) {
      await store.updateEnrollment(enrollment.id, {
        status: "completed",
        nextAt: null,
        completedAt: new Date(),
      });
      result.completed += 1;
      continue;
    }

    if (await store.hasSend(enrollment.id, step.stepOrder)) {
      await advance(store, enrollment.id, enrollment.currentStep, steps);
      result.skipped += 1;
      continue;
    }

    const user = await loadUser(enrollment.userId);
    if (!user?.email) {
      await store.updateEnrollment(enrollment.id, { status: "paused", nextAt: null });
      result.skipped += 1;
      continue;
    }

    if (!user.allowWelcome) {
      await store.updateEnrollment(enrollment.id, {
        status: "cancelled",
        nextAt: null,
        completedAt: new Date(),
      });
      result.skipped += 1;
      continue;
    }

    if (shouldSkipStep?.(step, user, enrollment)) {
      // Record skip so a later tick cannot re-send this step after a partial advance.
      await store.recordSend({
        enrollmentId: enrollment.id,
        stepOrder: step.stepOrder,
        vnocMailId: step.vnocMailId,
        status: "skipped",
      });
      await advance(store, enrollment.id, enrollment.currentStep, steps);
      result.skipped += 1;
      continue;
    }

    const last = await store.lastSendAtForUser(config.domainKey, user.userId);
    // Also space step 0 when another engagement mail already went (cross-campaign).
    if (last && daysBetween(new Date(), last) < minDays) {
      await store.updateEnrollment(enrollment.id, {
        nextAt: new Date(last.getTime() + minDays * 86400000),
      });
      result.skipped += 1;
      continue;
    }

    const tokens: Record<string, string> = {
      firstname: user.firstname || "there",
      domain: config.siteName,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
      ...(user.tokens || {}),
    };

    const unsubscribePageUrl = tokens.unsubscribePageUrl?.trim();
    const listUnsubscribeUrl = tokens.listUnsubscribeUrl?.trim();

    const subject = applyTokens(step.subject, tokens);
    let html = applyTokens(step.bodyHtml || `<p>${subject}</p>`, tokens);
    let text = htmlToText(html);
    if (unsubscribePageUrl) {
      html += `
<div style="padding:16px 24px;border-top:1px solid #e7e5e4;font-size:12px;color:#a8a29e;margin-top:24px;">
  <a href="${unsubscribePageUrl}" style="color:#78716c;text-decoration:none;">Unsubscribe</a>
  from product tips &amp; onboarding emails.
</div>`;
      text += `\n\nUnsubscribe: ${unsubscribePageUrl}\n`;
    }

    // Claim before send so two overlapping crons cannot both deliver the same step.
    if (store.tryClaimSend) {
      const claimed = await store.tryClaimSend({
        enrollmentId: enrollment.id,
        stepOrder: step.stepOrder,
        vnocMailId: step.vnocMailId,
      });
      if (!claimed) {
        if (await store.hasSend(enrollment.id, step.stepOrder)) {
          await advance(store, enrollment.id, enrollment.currentStep, steps);
        }
        result.skipped += 1;
        continue;
      }
    }

    try {
      await sendEmail({
        from: config.fromEmail,
        fromName: config.fromName || config.siteName,
        to: user.email,
        subject,
        html,
        text,
        replyTo: config.replyToEmail,
        listUnsubscribeUrl,
        unsubscribePageUrl,
      });
      await store.recordSend({
        enrollmentId: enrollment.id,
        stepOrder: step.stepOrder,
        vnocMailId: step.vnocMailId,
        status: "sent",
      });
      await advance(store, enrollment.id, enrollment.currentStep, steps);
      result.sent += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[engagement] send failed", enrollment.id, msg);
      await store.recordSend({
        enrollmentId: enrollment.id,
        stepOrder: step.stepOrder,
        vnocMailId: step.vnocMailId,
        status: "error",
        error: msg.slice(0, 480),
      });
      await store.updateEnrollment(enrollment.id, {
        nextAt: new Date(Date.now() + 6 * 3600000),
      });
      result.errors += 1;
    }
  }

  return result;
}

async function advance(
  store: EngagementStore,
  enrollmentId: number,
  currentStep: number,
  steps: { delayDays: number }[]
) {
  const nextIndex = currentStep + 1;
  if (nextIndex >= steps.length) {
    await store.updateEnrollment(enrollmentId, {
      status: "completed",
      currentStep: nextIndex,
      nextAt: null,
      completedAt: new Date(),
    });
    return;
  }
  const prevDelay = steps[currentStep]?.delayDays ?? 0;
  const nextDelay = steps[nextIndex]?.delayDays ?? prevDelay;
  const gapDays = Math.max(0, nextDelay - prevDelay);
  await store.updateEnrollment(enrollmentId, {
    currentStep: nextIndex,
    nextAt: new Date(Date.now() + gapDays * 86400000),
  });
}

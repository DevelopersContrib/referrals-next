import type { IntegrationEvent, IntegrationResult } from "./base";
import { prisma } from "@/lib/prisma";

/**
 * Zapier webhook helper for firing events to registered webhook URLs.
 */
export class ZapierIntegration {
  /**
   * Fire an event to all registered Zapier webhooks for a member.
   * Optionally filter by campaign_id.
   */
  static async fireEvent(
    memberId: number,
    event: IntegrationEvent,
    campaignId?: number
  ): Promise<IntegrationResult<{ sent: number; failed: number }>> {
    try {
      const where: Record<string, unknown> = { member_id: memberId };
      if (campaignId) {
        where.campaign_id = campaignId;
      }

      const webhooks = await prisma.member_zapier.findMany({ where });

      if (webhooks.length === 0) {
        return { success: true, data: { sent: 0, failed: 0 } };
      }

      let sent = 0;
      let failed = 0;

      for (const webhook of webhooks) {
        try {
          const resp = await fetch(webhook.link, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event),
          });

          if (resp.ok) {
            sent++;
          } else {
            console.error(
              `Zapier webhook ${webhook.id} failed with status ${resp.status}`
            );
            failed++;
          }
        } catch (err) {
          console.error(`Zapier webhook ${webhook.id} error:`, err);
          failed++;
        }
      }

      return { success: true, data: { sent, failed } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Fire a participant signup event
   */
  static async fireSignupEvent(
    memberId: number,
    participant: {
      id: number;
      email: string;
      name: string;
      campaign_id: number;
      date_signedup: Date;
    }
  ) {
    return this.fireEvent(
      memberId,
      {
        type: "participant.signup",
        timestamp: new Date().toISOString(),
        data: {
          participant_id: participant.id,
          email: participant.email,
          name: participant.name,
          campaign_id: participant.campaign_id,
          date_signedup: participant.date_signedup.toISOString(),
        },
      },
      participant.campaign_id
    );
  }

  /**
   * Fire a participant share event
   */
  static async fireShareEvent(
    memberId: number,
    share: {
      participant_id: number;
      campaign_id: number;
      social_type: number;
      url?: string;
    }
  ) {
    return this.fireEvent(
      memberId,
      {
        type: "participant.share",
        timestamp: new Date().toISOString(),
        data: {
          participant_id: share.participant_id,
          campaign_id: share.campaign_id,
          social_type: share.social_type,
          url: share.url || "",
        },
      },
      share.campaign_id
    );
  }

  /**
   * Fire a participant reward event
   */
  static async fireRewardEvent(
    memberId: number,
    reward: {
      participant_id: number;
      campaign_id: number;
      reward_type: number;
      coupon?: string;
      cash_value?: number;
    }
  ) {
    return this.fireEvent(
      memberId,
      {
        type: "participant.reward",
        timestamp: new Date().toISOString(),
        data: {
          participant_id: reward.participant_id,
          campaign_id: reward.campaign_id,
          reward_type: reward.reward_type,
          coupon: reward.coupon || "",
          cash_value: reward.cash_value || 0,
        },
      },
      reward.campaign_id
    );
  }

  /**
   * Test a webhook URL by sending a test payload
   */
  static async testWebhook(
    webhookUrl: string
  ): Promise<IntegrationResult<{ status: number }>> {
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          timestamp: new Date().toISOString(),
          data: { message: "This is a test webhook from Referrals.com" },
        }),
      });

      return {
        success: resp.ok,
        data: { status: resp.status },
        error: resp.ok ? undefined : `Webhook returned status ${resp.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

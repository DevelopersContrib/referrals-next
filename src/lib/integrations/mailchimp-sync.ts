import { prisma } from "@/lib/prisma";
import { MailchimpIntegration } from "./mailchimp";

/**
 * Add a new participant to the campaign's Mailchimp audience when configured.
 * Non-blocking — logs errors but never throws.
 */
export async function syncParticipantToMailchimp(
  campaignId: number,
  email: string,
  name?: string | null
): Promise<void> {
  try {
    const integration = await prisma.campaign_integrations.findFirst({
      where: { campaign_id: campaignId },
    });

    if (
      !integration?.mailchimp_allow ||
      !integration.mailchimp_key ||
      !integration.mailchimp_list
    ) {
      return;
    }

    const displayName = name?.trim() || email.split("@")[0];
    const [firstName, ...lastParts] = displayName.split(/\s+/);
    const lastName = lastParts.join(" ") || undefined;

    const mc = new MailchimpIntegration(integration.mailchimp_key);
    const result = await mc.addSubscriber(
      integration.mailchimp_list,
      email.toLowerCase().trim(),
      firstName,
      lastName
    );

    if (result.success) {
      console.log(
        `[mailchimp] Synced ${email} to list ${integration.mailchimp_list} (campaign ${campaignId})`
      );
    } else {
      console.error(
        `[mailchimp] Failed to sync ${email} (campaign ${campaignId}):`,
        result.error
      );
    }
  } catch (error) {
    console.error(
      `[mailchimp] Sync error for ${email} (campaign ${campaignId}):`,
      error
    );
  }
}

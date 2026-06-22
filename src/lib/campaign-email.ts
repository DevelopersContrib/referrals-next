import { sendEmail } from "@/lib/ses";

export interface CampaignEmailVars {
  name: string;
  email?: string;
  campaign: string;
  reward?: string;
  referralUrl?: string;
}

export function substituteCampaignEmailTemplate(
  text: string,
  vars: CampaignEmailVars
): string {
  return text
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{email\}\}/g, vars.email || "")
    .replace(/\{\{campaign\}\}/g, vars.campaign)
    .replace(/\{\{campaign_name\}\}/g, vars.campaign)
    .replace(/\{\{reward\}\}/g, vars.reward || "")
    .replace(/\{\{referral_url\}\}/g, vars.referralUrl || "");
}

export function toEmailHtml(message: string): string {
  if (/<[a-z][\s\S]*>/i.test(message)) {
    return message;
  }

  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">${message
    .split("\n")
    .filter(Boolean)
    .map((line) => `<p style="color: #374151; line-height: 1.6;">${line}</p>`)
    .join("")}</div>`;
}

export function formatRewardDescription(reward: {
  coupon?: string | null;
  redirect_url?: string | null;
  custom_message?: string | null;
  cash_value?: number | null;
  token_symbol?: string | null;
  token_amount?: number | null;
}): string {
  const parts: string[] = [];

  if (reward.coupon) parts.push(`Coupon code: ${reward.coupon}`);
  if (reward.redirect_url) parts.push(`Redeem here: ${reward.redirect_url}`);
  if (reward.custom_message) parts.push(reward.custom_message);
  if (reward.cash_value != null && reward.cash_value > 0) {
    parts.push(`Cash reward: $${reward.cash_value}`);
  }
  if (reward.token_symbol && reward.token_amount != null) {
    parts.push(`${reward.token_amount} ${reward.token_symbol}`);
  }

  return parts.join("\n") || "Your reward is ready!";
}

function resolveEntryEmailContent(
  customTemplate: { subject: string; template: string | null } | null | undefined,
  entrySubject: string | null | undefined,
  entryMessage: string | null | undefined
): { subject: string; body: string } | null {
  if (customTemplate?.subject?.trim() && customTemplate.template?.trim()) {
    return {
      subject: customTemplate.subject.trim(),
      body: customTemplate.template.trim(),
    };
  }

  if (entrySubject?.trim() && entryMessage?.trim()) {
    return {
      subject: entrySubject.trim(),
      body: entryMessage.trim(),
    };
  }

  return null;
}

export async function sendCampaignEntryEmail(params: {
  to: string;
  campaignName: string;
  participantName: string;
  referralUrl: string;
  entrySubject?: string | null;
  entryMessage?: string | null;
  customTemplate?: { subject: string; template: string | null } | null;
}): Promise<void> {
  const content = resolveEntryEmailContent(
    params.customTemplate,
    params.entrySubject,
    params.entryMessage
  );
  if (!content) return;

  const vars: CampaignEmailVars = {
    name: params.participantName,
    email: params.to,
    campaign: params.campaignName,
    referralUrl: params.referralUrl,
  };

  await sendEmail({
    to: params.to,
    subject: substituteCampaignEmailTemplate(content.subject, vars),
    html: toEmailHtml(substituteCampaignEmailTemplate(content.body, vars)),
    fromName: params.campaignName,
  });
}

export async function sendCampaignRewardEmail(params: {
  to: string;
  campaignName: string;
  participantName: string;
  rewardSubject?: string | null;
  rewardMessage?: string | null;
  reward: {
    coupon?: string | null;
    redirect_url?: string | null;
    custom_message?: string | null;
    cash_value?: number | null;
    token_symbol?: string | null;
    token_amount?: number | null;
  };
}): Promise<void> {
  const { rewardSubject, rewardMessage } = params;
  if (!rewardSubject?.trim() || !rewardMessage?.trim()) return;

  const rewardDescription = formatRewardDescription(params.reward);
  const vars: CampaignEmailVars = {
    name: params.participantName,
    email: params.to,
    campaign: params.campaignName,
    reward: rewardDescription,
  };

  let body = substituteCampaignEmailTemplate(rewardMessage.trim(), vars);
  if (!body.includes(rewardDescription) && !/\{\{reward\}\}/.test(rewardMessage)) {
    body = `${body}\n\n${rewardDescription}`;
  }

  await sendEmail({
    to: params.to,
    subject: substituteCampaignEmailTemplate(rewardSubject.trim(), vars),
    html: toEmailHtml(body),
    fromName: params.campaignName,
  });
}

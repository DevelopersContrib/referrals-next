/**
 * Campaign entry + reward email smoke (R4).
 *
 * Default — template + SES env checks (no DB, no send):
 *   npx tsx scripts/smoke-campaign-email.ts
 *
 * Live — widget signup → entry email, meet goal → reward email:
 *   npx tsx scripts/smoke-campaign-email.ts --live --to you@example.com
 *   npx tsx scripts/smoke-campaign-email.ts --live --to you@example.com --campaign-id 21562
 *   npx tsx scripts/smoke-campaign-email.ts --live --to you@example.com --base-url http://localhost:3000
 *
 * Requires .env.local with DATABASE_URL, AWS SES, NEXT_PUBLIC_APP_URL.
 */
import { prisma } from "../src/lib/prisma";
import {
  formatRewardDescription,
  substituteCampaignEmailTemplate,
} from "../src/lib/campaign-email";

function arg(name: string, fallback = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`OK: ${msg}`);
}

function smokeEmail(tag: string) {
  const ts = Date.now();
  return `smoke+${tag}+${ts}@referrals-smoke.test`;
}

function checkTemplateSubstitution() {
  console.log("\n1. Template substitution");

  const referralUrl = "https://referrals.com/t/smoke123";
  const vars = {
    name: "Ronan",
    email: "ronan@example.com",
    campaign: "Smoke Campaign",
    referralUrl,
    reward: "Coupon code: SMOKE10\nCash reward: $5",
  };

  const entryBody = substituteCampaignEmailTemplate(
    "Hi {{name}}, share {{referral_url}} to win in {{campaign}}.",
    vars
  );
  if (!entryBody.includes("Ronan") || !entryBody.includes(referralUrl)) {
    fail("entry template did not substitute {{name}} / {{referral_url}}");
  }
  pass("entry template substitutes {{name}} and {{referral_url}}");

  const rewardBody = substituteCampaignEmailTemplate(
    "{{name}}, your {{reward}} for {{campaign}} is ready.",
    vars
  );
  if (!rewardBody.includes("Ronan") || !rewardBody.includes("SMOKE10")) {
    fail("reward template did not substitute {{name}} / {{reward}}");
  }
  pass("reward template substitutes {{name}} and {{reward}}");

  const rewardDesc = formatRewardDescription({
    coupon: "SMOKE10",
    cash_value: 5,
  });
  if (!rewardDesc.includes("SMOKE10") || !rewardDesc.includes("$5")) {
    fail("formatRewardDescription missing coupon/cash");
  }
  pass(`reward description: ${rewardDesc.replace(/\n/g, " · ")}`);
}

function checkSesEnv(required: boolean) {
  console.log("\n2. SES env");
  const region = process.env.AWS_REGION || process.env.AWS_SES_REGION || "";
  const key = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";
  const from = process.env.AWS_SES_FROM_EMAIL?.trim() || "";

  const missing: string[] = [];
  if (!region) missing.push("AWS_REGION");
  if (!key || !secret) missing.push("AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY");
  if (!from) missing.push("AWS_SES_FROM_EMAIL");

  if (missing.length) {
    const msg = `${missing.join(", ")} not set`;
    if (required) fail(msg);
    console.log(`SKIP: ${msg} (required for --live)`);
    return;
  }

  pass(`region: ${region}`);
  pass("AWS credentials present");
  pass(`from: ${from}`);
}

type SmokeCampaign = {
  id: number;
  name: string;
  member_id: number;
  goal_type: string | null;
  num_visits: number | null;
  num_signups: number | null;
  campaign_entry_subject: string | null;
  campaign_entry_message: string | null;
  reward_notify_subject: string | null;
  reward_notify_message: string | null;
  rewardConfig: { cash_value: number | null; redirect_url: string | null };
};

async function findSmokeCampaign(campaignIdArg: string): Promise<SmokeCampaign> {
  const id = campaignIdArg ? Number(campaignIdArg) : undefined;
  if (campaignIdArg && !id) fail("--campaign-id must be a number");

  const rows = await prisma.member_campaigns.findMany({
    where: {
      ...(id ? { id } : {}),
      campaign_entry_subject: { not: null },
      campaign_entry_message: { not: null },
      reward_notify_subject: { not: null },
      reward_notify_message: { not: null },
    },
    take: id ? 1 : 25,
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      member_id: true,
      goal_type: true,
      num_visits: true,
      num_signups: true,
      campaign_entry_subject: true,
      campaign_entry_message: true,
      reward_notify_subject: true,
      reward_notify_message: true,
    },
  });

  for (const row of rows) {
    const reward = await prisma.campaign_reward.findFirst({
      where: { campaign_id: row.id },
      select: { cash_value: true, redirect_url: true },
    });
    if (!reward) continue;
    if (!row.campaign_entry_subject?.trim() || !row.campaign_entry_message?.trim()) continue;
    if (!row.reward_notify_subject?.trim() || !row.reward_notify_message?.trim()) continue;
    return { ...row, rewardConfig: reward };
  }

  fail(
    id
      ? `campaign ${id} missing entry/reward templates or campaign_reward row`
      : "no campaign with entry + reward templates and reward config (pass --campaign-id)"
  );
}

async function postJson(baseUrl: string, path: string, body: unknown) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    fail(`${path} returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  return { res, data };
}

async function meetGoalViaWidget(
  baseUrl: string,
  campaign: SmokeCampaign,
  participantId: number
) {
  if (campaign.goal_type === "signup") {
    const needed = campaign.num_signups || 1;
    for (let i = 0; i < needed; i++) {
      const { res, data } = await postJson(baseUrl, "/api/widget/signup", {
        campaignId: campaign.id,
        email: smokeEmail(`ref-${i}`),
        name: `Referral ${i + 1}`,
        referrerId: participantId,
      });
      if (!res.ok || !data.success) {
        fail(`referral signup ${i + 1} failed (${res.status}): ${JSON.stringify(data)}`);
      }
    }
    pass(`goal met via ${needed} referral signup(s)`);
    return;
  }

  if (campaign.goal_type === "visit") {
    const needed = campaign.num_visits || 1;
    const updated = await prisma.participants_share.updateMany({
      where: { campaign_id: campaign.id, participant_id: participantId },
      data: { clicks: needed },
    });
    if (updated.count === 0) {
      fail("no participants_share row to bump clicks — signup may have failed to create share");
    }
    pass(`goal met via ${needed} click(s) on share row`);
    return;
  }

  fail(
    `campaign ${campaign.id} goal_type=${campaign.goal_type ?? "null"} — set goal to signup (num_signups=1) or visit (num_visits=1) for smoke`
  );
}

async function runLive() {
  const to = arg("to").trim();
  const baseUrl = (arg("base-url", process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") || "")
    .replace(/\/+$/, "");
  const campaignIdArg = arg("campaign-id");

  if (!to) {
    fail("--live requires --to <inbox@yourdomain.com> (must be SES-verified or in sandbox allowlist)");
  }

  console.log("\n=== Campaign email live smoke ===");
  console.log(`base: ${baseUrl}`);
  console.log(`to:   ${to}`);

  checkTemplateSubstitution();
  checkSesEnv(true);

  console.log("\n3. Campaign");
  const campaign = await findSmokeCampaign(campaignIdArg);
  pass(
    `using campaign ${campaign.id} "${campaign.name}" goal=${campaign.goal_type ?? "?"} visits=${campaign.num_visits ?? "-"} signups=${campaign.num_signups ?? "-"}`
  );

  console.log("\n4. Widget signup → entry email");
  const participantName = "Smoke Ronan";
  const { res: signupRes, data: signupData } = await postJson(baseUrl, "/api/widget/signup", {
    campaignId: campaign.id,
    email: to,
    name: participantName,
  });

  if (!signupRes.ok || !signupData.success) {
    fail(`widget signup failed (${signupRes.status}): ${JSON.stringify(signupData)}`);
  }

  const participantId = Number(signupData.participantId);
  const shareUrl = String(signupData.shareUrl || "");
  if (!participantId || !shareUrl) {
    fail("widget signup missing participantId or shareUrl");
  }
  pass(`signup ok participantId=${participantId}`);
  pass(`shareUrl contains /t/: ${shareUrl.includes("/t/")}`);

  const previewSubject = substituteCampaignEmailTemplate(
    campaign.campaign_entry_subject!.trim(),
    {
      name: participantName,
      email: to,
      campaign: campaign.name,
      referralUrl: shareUrl,
    }
  );
  pass(`entry subject preview: ${previewSubject}`);

  console.log("\n5. Meet goal");
  await meetGoalViaWidget(baseUrl, campaign, participantId);

  console.log("\n6. Widget reward → reward email");
  const { res: rewardRes, data: rewardData } = await postJson(baseUrl, "/api/widget/reward", {
    campaignId: campaign.id,
    participantId,
  });

  if (!rewardRes.ok || !rewardData.success) {
    fail(`widget reward failed (${rewardRes.status}): ${JSON.stringify(rewardData)}`);
  }
  if (rewardData.alreadyClaimed) {
    pass("reward already claimed — reward email path was exercised on a prior run");
  } else {
    pass("reward claimed");
    const reward = rewardData.reward as Record<string, unknown> | undefined;
    const bits = [
      reward?.couponCode ? `coupon=${reward.couponCode}` : null,
      reward?.cashValue ? `cash=${reward.cashValue}` : null,
      reward?.redirectUrl ? `redirect=${reward.redirectUrl}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    pass(`reward payload: ${bits || "(custom message only)"}`);
  }

  const rewardPreview = substituteCampaignEmailTemplate(
    campaign.reward_notify_message!.trim(),
    {
      name: participantName,
      email: to,
      campaign: campaign.name,
      reward: formatRewardDescription({
        coupon: "SMOKE10",
        cash_value: campaign.rewardConfig.cash_value ?? 5,
        redirect_url: campaign.rewardConfig.redirect_url,
      }),
    }
  );
  if (!rewardPreview.includes(participantName)) {
    fail("reward preview missing participant name");
  }
  pass("reward body preview includes participant name");

  console.log("\nAll live checks passed.");
  console.log(`Check inbox ${to} for:`);
  console.log(`  1. Entry email — subject like "${previewSubject}" with referral link`);
  console.log(`  2. Reward email — subject from campaign reward template with coupon/cash`);
  console.log("");
}

async function main() {
  if (hasFlag("live")) {
    await runLive();
    return;
  }

  console.log("\n=== Campaign email smoke (offline) ===\n");
  checkTemplateSubstitution();
  checkSesEnv(false);
  console.log("\nOffline checks passed.");
  console.log("Run live widget + SES send:");
  console.log("  npx tsx scripts/smoke-campaign-email.ts --live --to you@example.com [--campaign-id N]\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

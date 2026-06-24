import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);
  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json({ name: member.name, email: member.email });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Reject if another member already uses this email
    const existing = await prisma.members.findFirst({
      where: { email, id: { not: memberId } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "That email address is already in use." },
        { status: 409 }
      );
    }

    await prisma.members.update({
      where: { id: memberId },
      data: { name, email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = parseInt(session.user.id, 10);

  try {
    const member = await prisma.members.findUnique({
      where: { id: memberId },
      select: { id: true, email: true },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    // The schema defines no FK cascade, so every owned row must be deleted
    // explicitly, children before parents, in a single atomic transaction.
    // Collect the parent ids the member owns to scope the child deletes.
    const [campaigns, urls, deals] = await Promise.all([
      prisma.member_campaigns.findMany({
        where: { member_id: memberId },
        select: { id: true },
      }),
      prisma.member_urls.findMany({
        where: { member_id: memberId },
        select: { id: true },
      }),
      prisma.brand_deals.findMany({
        where: { member_id: memberId },
        select: { id: true },
      }),
    ]);
    const campaignIds = campaigns.map((c) => c.id);
    const urlIds = urls.map((u) => u.id);
    const dealIds = deals.map((d) => d.id);

    const participants = await prisma.campaign_participants.findMany({
      where: { campaign_id: { in: campaignIds } },
      select: { id: true },
    });
    const participantIds = participants.map((p) => p.id);

    const byCampaign = { campaign_id: { in: campaignIds } };

    await prisma.$transaction([
      // Tier 3 — deepest children
      prisma.campaign_widget_votes.deleteMany({
        where: { participant_id: { in: participantIds } },
      }),
      prisma.deal_clicks.deleteMany({ where: { deal_id: { in: dealIds } } }),

      // Tier 2 — participant + campaign children (keyed by campaign_id)
      prisma.participants_invited_emails.deleteMany({ where: byCampaign }),
      prisma.participants_rewards.deleteMany({ where: byCampaign }),
      prisma.participants_share.deleteMany({ where: byCampaign }),
      prisma.campaign_participants.deleteMany({ where: byCampaign }),
      prisma.campaign_api_keys.deleteMany({ where: byCampaign }),
      prisma.campaign_challenges.deleteMany({ where: byCampaign }),
      prisma.campaign_coupons.deleteMany({ where: byCampaign }),
      prisma.campaign_email_content.deleteMany({ where: byCampaign }),
      prisma.campaign_integrations.deleteMany({ where: byCampaign }),
      prisma.campaign_lander.deleteMany({ where: byCampaign }),
      prisma.campaign_lander_preview.deleteMany({ where: byCampaign }),
      prisma.campaign_reward.deleteMany({ where: byCampaign }),
      prisma.campaign_social_content.deleteMany({ where: byCampaign }),
      prisma.campaign_socials_allowed.deleteMany({ where: byCampaign }),
      prisma.campaign_widget.deleteMany({ where: byCampaign }),
      prisma.campaign_widget_impressions.deleteMany({ where: byCampaign }),
      prisma.campaign_widget_impressions_count.deleteMany({ where: byCampaign }),
      prisma.campaign_widget_views.deleteMany({ where: byCampaign }),
      prisma.campaign_widget_vote_options.deleteMany({ where: byCampaign }),

      // Tier 2 — url/brand children (keyed by url_id)
      prisma.brand_subdomains.deleteMany({ where: { url_id: { in: urlIds } } }),
      prisma.brand_whitelabel.deleteMany({ where: { url_id: { in: urlIds } } }),
      prisma.url_socials.deleteMany({ where: { url_id: { in: urlIds } } }),

      // Tier 1 — directly member-owned rows
      prisma.brand_deals.deleteMany({ where: { member_id: memberId } }),
      prisma.campaign_contest.deleteMany({ where: { member_id: memberId } }),
      prisma.campaign_promote.deleteMany({ where: { member_id: memberId } }),
      prisma.integration_requests.deleteMany({ where: { member_id: memberId } }),
      prisma.member_zapier.deleteMany({ where: { member_id: memberId } }),
      prisma.member_mailchimp.deleteMany({ where: { member_id: memberId } }),
      prisma.member_payment.deleteMany({ where: { member_id: memberId } }),
      prisma.member_plan.deleteMany({ where: { member_id: memberId } }),
      prisma.member_keys.deleteMany({ where: { userid: memberId } }),
      prisma.url_plan.deleteMany({ where: { member_id: memberId } }),
      prisma.reviews.deleteMany({ where: { member_id: memberId } }),
      prisma.shoutouts.deleteMany({ where: { member_id: memberId } }),
      prisma.testimonials.deleteMany({ where: { member_id: memberId } }),
      prisma.topic_comments.deleteMany({ where: { member_id: memberId } }),
      prisma.topics.deleteMany({ where: { member_id: memberId } }),
      prisma.member_tokens.deleteMany({ where: { email: member.email } }),
      prisma.member_urls.deleteMany({ where: { member_id: memberId } }),
      prisma.member_campaigns.deleteMany({ where: { member_id: memberId } }),

      // Finally the account itself
      prisma.members.delete({ where: { id: memberId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

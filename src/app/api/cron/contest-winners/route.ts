import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { authenticateCron } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  if (!authenticateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find contests past end_date that have not yet been processed
    const contests = await prisma.campaign_contest.findMany({
      where: {
        is_on: true,
        end_date: { not: null },
      },
    });

    const expiredContests = contests.filter((c) => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      return endDate < now;
    });

    const results: { contestId: number; winners: string[] }[] = [];

    for (const contest of expiredContests) {
      const maxWinners = contest.max_winners || 1;

      // Get all participants for this campaign
      const participants = await prisma.campaign_participants.findMany({
        where: { campaign_id: contest.campaign_id },
      });

      if (participants.length === 0) continue;

      // Shuffle and pick random winners
      const shuffled = participants.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, maxWinners);

      const winnerEmails = winners.map((w) => w.email);

      // Store winner emails in the contest record
      await prisma.campaign_contest.update({
        where: { id: contest.id },
        data: {
          is_on: false,
          winner_email: JSON.stringify(winnerEmails),
        },
      });

      // Get campaign details for the notification
      const campaign = await prisma.member_campaigns.findUnique({
        where: { id: contest.campaign_id },
      });

      // Send notification emails to winners
      for (const winner of winners) {
        try {
          await sendEmail({
            to: winner.email,
            subject: `You won the ${contest.contest_name} contest!`,
            fromName: "Referrals.com",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Congratulations, ${winner.name}!</h2>
                <p>You have been selected as a winner in the <strong>${contest.contest_name}</strong> contest${campaign ? ` for ${campaign.name}` : ""}.</p>
                <p>The campaign organizer will be in touch with your reward details.</p>
                <p>Thank you for participating!</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error(`Failed to email winner ${winner.email}:`, emailErr);
        }
      }

      // Notify the campaign owner
      const owner = await prisma.members.findUnique({
        where: { id: contest.member_id },
      });

      if (owner) {
        try {
          await sendEmail({
            to: owner.email,
            subject: `Contest "${contest.contest_name}" winners selected`,
            fromName: "Referrals.com",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Contest Winners Selected</h2>
                <p>The contest <strong>${contest.contest_name}</strong> has ended. Winners have been randomly selected:</p>
                <ul>${winnerEmails.map((e) => `<li>${e}</li>`).join("")}</ul>
                <p>Winners have been notified via email.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error(`Failed to email owner ${owner.email}:`, emailErr);
        }
      }

      results.push({ contestId: contest.id, winners: winnerEmails });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Contest winners cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

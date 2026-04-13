import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const participantId = parseInt(id, 10);

  if (isNaN(participantId)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const participant = await prisma.campaign_participants.findFirst({
      where: { id: participantId },
    });

    if (!participant) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const campaign = await prisma.member_campaigns.findFirst({
      where: { id: participant.campaign_id },
    });

    if (!campaign) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const brand = await prisma.member_urls.findFirst({
      where: { id: campaign.url_id },
    });

    if (!brand?.slug) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const destination = `/p/${brand.slug}/campaign/${campaign.id}?ref=${participantId}`;
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

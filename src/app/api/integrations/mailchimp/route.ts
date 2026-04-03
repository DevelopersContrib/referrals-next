import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MailchimpIntegration } from "@/lib/integrations/mailchimp";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);

    // Get the member's MailChimp API key
    const mailchimpRecord = await prisma.member_mailchimp.findFirst({
      where: { member_id: memberId },
    });

    if (!mailchimpRecord) {
      return NextResponse.json(
        { error: "MailChimp not connected. Please save your API key first." },
        { status: 404 }
      );
    }

    const mc = new MailchimpIntegration(mailchimpRecord.api_key);
    const result = await mc.getLists();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch lists" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: true,
      lists: result.data,
    });
  } catch (error) {
    console.error("MailChimp GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberId = parseInt(session.user.id, 10);
    const body = await req.json();
    const { api_key } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: "MailChimp API key is required" },
        { status: 400 }
      );
    }

    // Test the connection first
    const mc = new MailchimpIntegration(api_key);
    const isValid = await mc.testConnection();

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid MailChimp API key. Connection test failed." },
        { status: 400 }
      );
    }

    // Upsert the API key
    const existing = await prisma.member_mailchimp.findFirst({
      where: { member_id: memberId },
    });

    if (existing) {
      await prisma.member_mailchimp.update({
        where: { id: existing.id },
        data: { api_key },
      });
    } else {
      await prisma.member_mailchimp.create({
        data: {
          member_id: memberId,
          api_key,
        },
      });
    }

    // Get lists to return
    const listsResult = await mc.getLists();

    return NextResponse.json({
      success: true,
      message: "MailChimp connected successfully",
      lists: listsResult.data || [],
    });
  } catch (error) {
    console.error("MailChimp POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

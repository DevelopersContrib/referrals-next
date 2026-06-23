import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const keys = await prisma.member_keys.findMany({
      orderBy: { date_generated: "desc" },
      take: 200,
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10);

    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.member_keys.delete({ where: { user_key_id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}

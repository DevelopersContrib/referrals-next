import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdminApi } from "@/lib/require-platform-admin";

export async function GET() {
  const authResult = await requirePlatformAdminApi();
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: authResult.status }
    );
  }

  try {
    const brands = await prisma.member_urls.findMany({
      where: { member_id: { gt: 0 } },
      orderBy: { id: "desc" },
      select: { id: true, domain: true, member_id: true },
    });

    const memberIds = [...new Set(brands.map((b) => b.member_id))];
    const members = await prisma.members.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true },
    });
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = brands.map((brand) =>
      [
        brand.id,
        escapeCSV(brand.domain),
        escapeCSV(memberMap.get(brand.member_id) ?? ""),
      ].join(",")
    );

    const csv = ["Brand Id,Domain,Owner", ...rows].join("\n");
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="data_export_brand${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting all brands:", error);
    return NextResponse.json(
      { error: "Failed to export brands" },
      { status: 500 }
    );
  }
}

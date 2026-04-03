import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberId = parseInt(session.user.id, 10);

    const brands = await prisma.member_urls.findMany({
      where: { member_id: memberId },
      orderBy: { date_added: "desc" },
    });

    // Build CSV
    const headers = [
      "ID",
      "Domain",
      "URL",
      "Description",
      "Logo URL",
      "Background Image",
      "Slug",
      "Date Added",
      "Plan Expiry",
    ];

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
        escapeCSV(brand.url),
        escapeCSV(brand.description),
        escapeCSV(brand.logo_url),
        escapeCSV(brand.background_image),
        escapeCSV(brand.slug),
        brand.date_added ? new Date(brand.date_added).toISOString() : "",
        brand.plan_expiry ? new Date(brand.plan_expiry).toISOString() : "",
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="brands-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting brands:", error);
    return NextResponse.json(
      { error: "Failed to export brands" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrandIfAccessible } from "@/lib/brand-access";

type RouteParams = { params: Promise<{ brandId: string }> };

const SOCIAL_KEYS = [
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "linkedin",
  "github",
  "discord",
  "telegram",
] as const;

type SocialKey = (typeof SOCIAL_KEYS)[number];

function rowToSocials(
  rows: Array<{ social: string; profile_url: string }>
): Record<SocialKey, string> {
  const map = Object.fromEntries(
    SOCIAL_KEYS.map((k) => [k, ""])
  ) as Record<SocialKey, string>;

  for (const row of rows) {
    const key = row.social === "x" ? "twitter" : row.social;
    if (SOCIAL_KEYS.includes(key as SocialKey)) {
      map[key as SocialKey] = row.profile_url;
    }
  }
  return map;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const { brandId } = await params;
  const id = parseInt(brandId, 10);
  if (isNaN(id))
    return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });

  const brand = await getBrandIfAccessible(
    id,
    memberId,
    Boolean((session.user as { isAdmin?: boolean }).isAdmin)
  );
  if (!brand)
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const rows = await prisma.url_socials.findMany({ where: { url_id: id } });
  return NextResponse.json(rowToSocials(rows));
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const { brandId } = await params;
  const id = parseInt(brandId, 10);
  if (isNaN(id))
    return NextResponse.json({ error: "Invalid brand ID" }, { status: 400 });

  const brand = await getBrandIfAccessible(
    id,
    memberId,
    Boolean((session.user as { isAdmin?: boolean }).isAdmin)
  );
  if (!brand)
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const body = await req.json();
  let saved = 0;

  for (const key of SOCIAL_KEYS) {
    const value = String(body[key] ?? body[key === "twitter" ? "x" : key] ?? "").trim();
    const dbKey = key === "twitter" ? "twitter" : key;

    const existing = await prisma.url_socials.findFirst({
      where: { url_id: id, social: dbKey },
    });

    if (existing) {
      if (value) {
        await prisma.url_socials.update({
          where: { id: existing.id },
          data: { profile_url: value },
        });
        saved++;
      } else {
        await prisma.url_socials.delete({ where: { id: existing.id } });
      }
    } else if (value) {
      await prisma.url_socials.create({
        data: { url_id: id, social: dbKey, profile_url: value },
      });
      saved++;
    }
  }

  return NextResponse.json({
    status: saved > 0,
    message:
      saved > 0
        ? "Social urls have been successfully updated."
        : "No social urls were saved.",
  });
}

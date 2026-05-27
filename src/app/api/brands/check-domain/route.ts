import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractDomainFromUrl } from "@/lib/brand-access";
import { memberIdIsPlatformAdmin } from "@/lib/platform-admin";

const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = parseInt(session.user.id, 10);
  const isAdmin =
    Boolean((session.user as { isAdmin?: boolean }).isAdmin) ||
    (await memberIdIsPlatformAdmin(memberId));

  const body = await req.json();
  const website = String(body.website ?? "").trim();
  const excludeBrandId = body.excludeBrandId
    ? parseInt(String(body.excludeBrandId), 10)
    : undefined;

  const domain = extractDomainFromUrl(website);

  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({
      available: false,
      invalid_domain: true,
      is_admin: isAdmin,
      url_link: "",
    });
  }

  const existing = await prisma.member_urls.findFirst({
    where: {
      domain,
      ...(excludeBrandId ? { NOT: { id: excludeBrandId } } : {}),
    },
  });

  if (existing) {
    return NextResponse.json({
      available: false,
      invalid_domain: false,
      is_admin: isAdmin,
      url_link: `/brands/${existing.id}`,
    });
  }

  return NextResponse.json({
    available: true,
    invalid_domain: false,
    is_admin: isAdmin,
    url_link: "",
  });
}

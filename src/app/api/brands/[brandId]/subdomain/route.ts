import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCanAccessBrand } from "@/lib/brand-access";
import { getBrandEntitlement } from "@/lib/member-subscription";
import {
  DomainError,
  RESERVED_SUBDOMAINS,
  ROOT_DOMAIN,
  forgetHost,
  vercelAddDomain,
  vercelDomainStatus,
  vercelRemoveDomain,
} from "@/lib/brand-domains";

type Ctx = { params: Promise<{ brandId: string }> };

async function ownerContext(ctx: Ctx, allowAdmin: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const memberId = parseInt(session.user.id, 10);
  const brandId = parseInt((await ctx.params).brandId, 10);
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  // Owner only (admins may read). Prevents reading or changing other brands.
  const ok = allowAdmin
    ? await userCanAccessBrand(brandId, memberId, isAdmin)
    : (await prisma.member_urls.findUnique({ where: { id: brandId }, select: { member_id: true } }))
        ?.member_id === memberId;
  if (!ok) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { brandId, memberId };
}

const hostOf = (sub: string) => `${sub}.${ROOT_DOMAIN}`;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const c = await ownerContext(ctx, true);
  if ("error" in c) return c.error;

  const subdomain = await prisma.brand_subdomains.findFirst({
    where: { url_id: c.brandId },
    orderBy: { id: "desc" },
  });
  const status = subdomain?.subdomain ? await vercelDomainStatus(hostOf(subdomain.subdomain)) : null;
  return NextResponse.json({ subdomain, status });
}

/** Claim or change the brand's {name}.referrals.com address. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const c = await ownerContext(ctx, false);
  if ("error" in c) return c.error;

  const entitlement = await getBrandEntitlement(c.brandId, { applyAdminBypass: false });
  if (!entitlement?.hideBranding) {
    return NextResponse.json(
      { error: "Publish this brand to get your own address.", code: "REQUIRES_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { subdomain?: unknown };
  const subdomain = String(body.subdomain ?? "").toLowerCase().trim();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(subdomain)) {
    return NextResponse.json(
      { error: "Use 3 to 63 letters, numbers or dashes, not starting or ending with a dash." },
      { status: 400 },
    );
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.json({ error: `${subdomain} is reserved. Try another name.` }, { status: 409 });
  }

  const taken = await prisma.brand_subdomains.findFirst({
    where: { subdomain, url_id: { not: c.brandId } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "That name is taken. Try another." }, { status: 409 });
  }

  const existing = await prisma.brand_subdomains.findFirst({
    where: { url_id: c.brandId },
    orderBy: { id: "desc" },
  });

  try {
    await vercelAddDomain(hostOf(subdomain), { alreadyMine: existing?.subdomain === subdomain });
  } catch (e) {
    const message = e instanceof DomainError ? e.message : "Couldn't connect that address. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const result = existing
    ? await prisma.brand_subdomains.update({ where: { id: existing.id }, data: { subdomain } })
    : await prisma.brand_subdomains.create({
        data: { url_id: c.brandId, subdomain, created_by: c.memberId },
      });

  if (existing?.subdomain && existing.subdomain !== subdomain) {
    await vercelRemoveDomain(hostOf(existing.subdomain));
    forgetHost(hostOf(existing.subdomain));
  }
  forgetHost(hostOf(subdomain));

  return NextResponse.json({ subdomain: result, status: await vercelDomainStatus(hostOf(subdomain)) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const c = await ownerContext(ctx, false);
  if ("error" in c) return c.error;

  const rows = await prisma.brand_subdomains.findMany({ where: { url_id: c.brandId } });
  for (const row of rows) {
    if (row.subdomain) {
      await vercelRemoveDomain(hostOf(row.subdomain));
      forgetHost(hostOf(row.subdomain));
    }
  }
  await prisma.brand_subdomains.deleteMany({ where: { url_id: c.brandId } });
  return NextResponse.json({ ok: true });
}

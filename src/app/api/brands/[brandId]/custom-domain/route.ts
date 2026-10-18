import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrandEntitlement } from "@/lib/member-subscription";
import {
  DomainError,
  ROOT_DOMAIN,
  cleanDomain,
  domainVariants,
  forgetHost,
  vercelAddDomain,
  vercelDomainStatus,
  vercelProjectId,
  vercelRemoveDomain,
} from "@/lib/brand-domains";

type Ctx = { params: Promise<{ brandId: string }> };

async function owner(ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const memberId = parseInt(session.user.id, 10);
  const brandId = parseInt((await ctx.params).brandId, 10);
  const brand = await prisma.member_urls.findUnique({ where: { id: brandId }, select: { member_id: true } });
  if (!brand || brand.member_id !== memberId) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { brandId, memberId };
}

/** The brand's custom domain row managed by this app (legacy rows are left alone). */
function currentRow(brandId: number) {
  return prisma.brand_whitelabel.findFirst({
    where: { url_id: brandId, domain: { not: null } },
    orderBy: { id: "desc" },
    select: { id: true, domain: true, vercel_identifier: true },
  });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const c = await owner(ctx);
  if ("error" in c) return c.error;
  const row = await currentRow(c.brandId);
  const status = row?.domain ? await vercelDomainStatus(row.domain) : null;
  return NextResponse.json({ domain: row?.domain ?? null, status });
}

/** Connect refer.theirsite.com (or any hostname they own) to this brand. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const c = await owner(ctx);
  if ("error" in c) return c.error;

  const entitlement = await getBrandEntitlement(c.brandId, { applyAdminBypass: false });
  if (!entitlement?.hideBranding) {
    return NextResponse.json(
      { error: "Publish this brand to use your own domain.", code: "REQUIRES_SUBSCRIPTION" },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { domain?: unknown };
  const domain = cleanDomain(String(body.domain ?? ""));
  if (!domain) {
    return NextResponse.json({ error: "Enter a domain like refer.yoursite.com." }, { status: 400 });
  }
  if (domain === ROOT_DOMAIN || domain.endsWith(`.${ROOT_DOMAIN}`)) {
    return NextResponse.json(
      { error: "For a referrals.com address, use the subdomain box above." },
      { status: 400 },
    );
  }

  const usedElsewhere = await prisma.brand_whitelabel.findFirst({
    where: { domain: { in: [domain, ...domainVariants(domain)] }, url_id: { not: c.brandId } },
    select: { id: true },
  });
  if (usedElsewhere) {
    return NextResponse.json({ error: "That domain is already connected to another brand." }, { status: 409 });
  }

  const existing = await currentRow(c.brandId);
  try {
    await vercelAddDomain(domain, {
      alreadyMine: existing?.domain === domain && existing.vercel_identifier === vercelProjectId(),
    });
  } catch (e) {
    const message = e instanceof DomainError ? e.message : "Couldn't connect that domain. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (existing) {
    await prisma.brand_whitelabel.update({
      where: { id: existing.id },
      data: { domain, vercel_identifier: vercelProjectId() },
    });
    if (existing.domain && existing.domain !== domain) {
      // Only remove it from Vercel if it was ours (legacy rows lived in another project).
      if (existing.vercel_identifier === vercelProjectId()) await vercelRemoveDomain(existing.domain);
      forgetHost(existing.domain);
    }
  } else {
    await prisma.brand_whitelabel.create({
      data: { url_id: c.brandId, created_by: c.memberId, domain, vercel_identifier: vercelProjectId() },
    });
  }
  forgetHost(domain);

  return NextResponse.json({ domain, status: await vercelDomainStatus(domain) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const c = await owner(ctx);
  if ("error" in c) return c.error;
  const row = await currentRow(c.brandId);
  if (row?.domain) {
    if (row.vercel_identifier === vercelProjectId()) await vercelRemoveDomain(row.domain);
    forgetHost(row.domain);
    await prisma.brand_whitelabel.update({ where: { id: row.id }, data: { domain: null } });
  }
  return NextResponse.json({ ok: true });
}

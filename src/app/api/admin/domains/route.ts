import { NextRequest, NextResponse } from "next/server";
import { adminApiGuard } from "@/lib/require-platform-admin";
import { prisma } from "@/lib/prisma";
import {
  ROOT_DOMAIN,
  forgetHost,
  vercelDomainStatus,
  vercelDomainsEnabled,
  vercelProjectId,
  vercelRemoveDomain,
} from "@/lib/brand-domains";
import { networkSiteByKey } from "@/lib/network-sites";

/**
 * Admin Domains page actions:
 *   check      - where an address stands on Vercel (live, or the DNS still missing)
 *   disconnect - remove a brand's white-label address, the same way its owner would
 */
export async function POST(req: NextRequest) {
  const denied = await adminApiGuard();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as { action?: string; kind?: string; id?: string };
  const { action, kind } = body;
  const id = String(body.id ?? "");

  const host = await hostFor(kind, id);
  if (!host) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  if (action === "check") {
    if (!vercelDomainsEnabled()) {
      return NextResponse.json({ error: "Add VERCEL_API_TOKEN to check addresses." }, { status: 400 });
    }
    return NextResponse.json({ status: await vercelDomainStatus(host) });
  }

  if (action === "disconnect") {
    if (kind === "subdomain") {
      await vercelRemoveDomain(host);
      await prisma.brand_subdomains.delete({ where: { id: Number(id) } });
    } else if (kind === "custom") {
      const row = await prisma.brand_whitelabel.findUnique({
        where: { id: Number(id) },
        select: { vercel_identifier: true },
      });
      // Legacy rows were added in another Vercel project; leave that project alone.
      if (row?.vercel_identifier === vercelProjectId()) await vercelRemoveDomain(host);
      await prisma.brand_whitelabel.update({ where: { id: Number(id) }, data: { domain: null } });
    } else {
      return NextResponse.json(
        { error: "Network sites are turned on and off in src/lib/network-sites.ts." },
        { status: 400 },
      );
    }
    forgetHost(host);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

async function hostFor(kind: string | undefined, id: string): Promise<string | null> {
  if (kind === "network") return networkSiteByKey(id)?.domain ?? null;
  const rowId = parseInt(id, 10);
  if (!Number.isFinite(rowId)) return null;
  if (kind === "subdomain") {
    const row = await prisma.brand_subdomains.findUnique({ where: { id: rowId }, select: { subdomain: true } });
    return row?.subdomain ? `${row.subdomain}.${ROOT_DOMAIN}` : null;
  }
  if (kind === "custom") {
    const row = await prisma.brand_whitelabel.findUnique({ where: { id: rowId }, select: { domain: true } });
    return row?.domain ?? null;
  }
  return null;
}

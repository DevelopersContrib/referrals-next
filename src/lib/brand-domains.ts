import { prisma } from "@/lib/prisma";
import { getBrandEntitlement } from "@/lib/member-subscription";

/**
 * White-label addresses for a brand:
 *   - subdomain:     {name}.referrals.com   (brand_subdomains.subdomain)
 *   - custom domain: refer.theirsite.com    (brand_whitelabel.domain)
 *
 * Each address is added to this Vercel project through the Vercel API, so
 * Vercel issues the certificate. src/proxy.ts maps the incoming host to the
 * brand and serves its /p/{slug} pages there. Only white-label (paid or
 * network) brands are served; a lapsed brand falls back to referrals.com.
 */

export const ROOT_DOMAIN = "referrals.com";

/** Hosts that are the main app, never a brand. */
const APP_HOSTS = new Set([
  ROOT_DOMAIN,
  `www.${ROOT_DOMAIN}`,
  `api.${ROOT_DOMAIN}`,
  `beta.${ROOT_DOMAIN}`,
  "localhost",
  "127.0.0.1",
]);

/** Names nobody can take as a subdomain. */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "app", "beta", "docs", "admin", "dashboard", "mail", "email", "smtp",
  "blog", "forum", "help", "support", "status", "cdn", "static", "assets", "img",
  "images", "whitelabel", "partners", "affiliate", "billing", "pay", "login", "signin",
  "signup", "auth", "dev", "staging", "test", "demo", "ns1", "ns2", "referrals",
]);

export function normalizeHost(raw: string | null | undefined): string {
  return (raw ?? "").toLowerCase().trim().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function isAppHost(host: string): boolean {
  if (!host || APP_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app") || host.endsWith(".localhost")) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (normalizeHost(new URL(appUrl).host) === host) return true;
    } catch {
      /* ignore bad env */
    }
  }
  return false;
}

/** "Refer.Example.com/" -> "refer.example.com", or null when it isn't a hostname. */
export function cleanDomain(input: string): string | null {
  const host = normalizeHost(
    input.replace(/^https?:\/\//i, "").split("/")[0].split("?")[0],
  );
  if (host.length > 200 || !/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(host)) {
    return null;
  }
  if (!/\.[a-z]{2,}$/.test(host)) return null;
  return host;
}

export function isRootSubdomain(host: string): boolean {
  return host.endsWith(`.${ROOT_DOMAIN}`) && host.split(".").length === 3;
}

// ---------------------------------------------------------------------------
// Host -> brand (used by src/proxy.ts on every request to a non-app host)
// ---------------------------------------------------------------------------

export type HostBrand = { slug: string; brandId: number };

const CACHE_MS = 60_000;
const hostCache = new Map<string, { at: number; value: HostBrand | null }>();

export async function brandForHost(host: string): Promise<HostBrand | null> {
  const hit = hostCache.get(host);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const value = await lookupHost(host).catch(() => null);
  hostCache.set(host, { at: Date.now(), value });
  if (hostCache.size > 2000) hostCache.delete(hostCache.keys().next().value as string);
  return value;
}

async function lookupHost(host: string): Promise<HostBrand | null> {
  let brandId: number | null = null;

  if (isRootSubdomain(host)) {
    const sub = host.slice(0, -(ROOT_DOMAIN.length + 1));
    const row = await prisma.brand_subdomains.findFirst({
      where: { subdomain: sub },
      orderBy: { id: "desc" },
      select: { url_id: true },
    });
    brandId = row?.url_id ?? null;
  } else {
    const bare = host.replace(/^www\./, "");
    const row =
      (await prisma.brand_whitelabel.findFirst({
        where: { domain: host },
        orderBy: { id: "desc" },
        select: { url_id: true },
      })) ??
      (await prisma.brand_whitelabel.findFirst({
        where: { domain: { in: [bare, `www.${bare}`] } },
        orderBy: { id: "desc" },
        select: { url_id: true },
      }));
    brandId = row?.url_id ?? null;
  }
  if (!brandId) return null;

  const brand = await prisma.member_urls.findUnique({
    where: { id: brandId },
    select: { slug: true },
  });
  if (!brand?.slug) return null;

  // White label is a paid feature: a lapsed brand stops being served here.
  const entitlement = await getBrandEntitlement(brandId, { applyAdminBypass: false });
  if (!entitlement?.hideBranding) return null;

  return { slug: brand.slug, brandId };
}

/** Drop cached lookups after an owner changes an address. */
export function forgetHost(host: string | null | undefined) {
  if (host) hostCache.delete(normalizeHost(host));
}

// ---------------------------------------------------------------------------
// Vercel project domains
// ---------------------------------------------------------------------------

const VERCEL_API = "https://api.vercel.com";

function vercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  return {
    token,
    projectId: process.env.VERCEL_PROJECT_ID || "prj_XlfIn826GQlFPeAttCG9DnxpCcoR",
    teamId: process.env.VERCEL_TEAM_ID || "team_FqZb9TDzZZxSAUgKM7Wiw1kh",
  };
}

export function vercelDomainsEnabled(): boolean {
  return vercelConfig() !== null;
}

export function vercelProjectId(): string | null {
  return vercelConfig()?.projectId ?? null;
}

async function vercel(path: string, init: RequestInit = {}) {
  const cfg = vercelConfig();
  if (!cfg) throw new DomainError("Custom addresses aren't switched on yet. Please contact support.");
  const url = `${VERCEL_API}${path.replace("{project}", cfg.projectId)}${path.includes("?") ? "&" : "?"}teamId=${cfg.teamId}`;
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

export class DomainError extends Error {}

/** www.acme.com and acme.com count as the same domain. */
export function domainVariants(host: string): string[] {
  const bare = host.replace(/^www\./, "");
  return [bare, `www.${bare}`];
}

/**
 * Add the address to the Vercel project. If it's already on the project, that
 * only counts as success when this brand is the one that added it.
 */
export async function vercelAddDomain(name: string, opts: { alreadyMine: boolean }): Promise<void> {
  const r = await vercel(`/v10/projects/{project}/domains`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (r.ok) return;
  const err = (r.body.error ?? {}) as { code?: string; message?: string };
  if (err.code === "domain_already_in_use" || err.code === "domain_already_exists") {
    // Already on our project for this same brand: nothing to do. Otherwise it
    // belongs to another brand, our own app, or another Vercel project.
    const onProject = await vercel(`/v9/projects/{project}/domains/${encodeURIComponent(name)}`);
    if (onProject.ok && opts.alreadyMine) return;
    throw new DomainError(`${name} is already connected somewhere else. Remove it there first, or contact support.`);
  }
  throw new DomainError(err.message || `Couldn't connect ${name}. Please try again.`);
}

export async function vercelRemoveDomain(name: string): Promise<void> {
  if (!vercelConfig()) return;
  await vercel(`/v9/projects/{project}/domains/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => null);
}

/** How long an address that isn't live yet stays reserved for the brand that added it. */
export const UNVERIFIED_CLAIM_DAYS = 7;

/**
 * Whether another brand's claim on this address still blocks a new one.
 *
 * Vercel only gives a brand an address for good once its DNS points at us
 * (verified and not misconfigured), which proves control of the domain. An
 * address that never got there is held for UNVERIFIED_CLAIM_DAYS from when it
 * was added to the project, then anyone who owns it can claim it. When Vercel
 * can't be asked, or the row came from the legacy project, the claim is kept.
 */
export async function claimIsHeld(row: { domain: string; vercel_identifier: string | null }): Promise<boolean> {
  const cfg = vercelConfig();
  if (!cfg || row.vercel_identifier !== cfg.projectId) return true;
  const name = encodeURIComponent(row.domain);
  const [project, config] = await Promise.all([
    vercel(`/v9/projects/{project}/domains/${name}`).catch(() => null),
    vercel(`/v6/domains/${name}/config`).catch(() => null),
  ]);
  if (project?.status === 404) return false; // no longer on our project
  if (!project?.ok || !config?.ok) return true;
  if (project.body.verified !== false && !config.body.misconfigured) return true;
  const addedAt = Number(project.body.createdAt) || 0;
  return !addedAt || Date.now() - addedAt < UNVERIFIED_CLAIM_DAYS * 86_400_000;
}

export type DomainStatus = {
  /** Vercel has the address and it points at us with a valid setup. */
  live: boolean;
  /** DNS records the owner still has to add. */
  records: { type: string; name: string; value: string }[];
  note: string | null;
};

/** Where an address stands, plus the exact DNS records still missing. */
export async function vercelDomainStatus(name: string): Promise<DomainStatus> {
  if (!vercelConfig()) {
    return { live: false, records: [], note: "Waiting for Referrals.com to switch on custom addresses." };
  }
  const [project, config] = await Promise.all([
    vercel(`/v9/projects/{project}/domains/${encodeURIComponent(name)}`),
    vercel(`/v6/domains/${encodeURIComponent(name)}/config`),
  ]);
  if (!project.ok) {
    return { live: false, records: [], note: "Not connected yet. Save it again to connect." };
  }

  const records: DomainStatus["records"] = [];
  const verified = project.body.verified !== false;
  if (!verified) {
    // Try to verify now, in case the TXT record was just added.
    const v = await vercel(`/v9/projects/{project}/domains/${encodeURIComponent(name)}/verify`, { method: "POST" });
    if (!v.ok) {
      const items = (project.body.verification ?? []) as { type: string; domain: string; value: string }[];
      for (const item of items) records.push({ type: item.type, name: item.domain, value: item.value });
    }
  }

  const misconfigured = config.ok ? Boolean(config.body.misconfigured) : true;
  if (misconfigured && !isRootSubdomain(name)) {
    const apex = name.split(".").length === 2;
    records.unshift(
      apex
        ? { type: "A", name: "@", value: "76.76.21.21" }
        : { type: "CNAME", name: name.split(".")[0], value: "cname.vercel-dns.com" },
    );
  }

  const live = verified && !misconfigured;
  return {
    live,
    records,
    note: live
      ? null
      : misconfigured && isRootSubdomain(name)
        ? "Setting up. This usually takes a minute or two."
        : "Add the DNS record below at your domain provider. It can take a few minutes to an hour to go live.",
  };
}

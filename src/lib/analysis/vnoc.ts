/**
 * VNOC (contrib_rdb) authoritative brand lookup.
 *
 * Data model discovered via read-only introspection:
 *   Domains(DomainId, DomainName, Title, Logo, Description, Tagline, VnocDomainId)
 *   FrameworkAttributes(AttributeId, AttributeName)   e.g. 'twitter_page', 'facebook_page'
 *   FrameworkAttributeValues(FieldValue, AttributeId, DomainId)
 *
 * Socials are stored sparsely as EAV rows; values are cleaned (drop "0" / empty,
 * normalize legacy `#!/` Twitter URLs).
 */
import { vnocPrisma } from "@/lib/vnoc-db";
import type { DiscoveredSocial } from "./types";
import { normalizeSocialUrl, platformForUrl } from "./social";

export interface VnocMatch {
  matched: boolean;
  vnocDomainId: number | null;
  name: string | null;
  logoUrl: string | null;
  description: string | null;
  tagline: string | null;
  socials: DiscoveredSocial[];
  raw: unknown;
}

const EMPTY: VnocMatch = {
  matched: false,
  vnocDomainId: null,
  name: null,
  logoUrl: null,
  description: null,
  tagline: null,
  socials: [],
  raw: null,
};

type DomainRow = {
  DomainId: number | bigint;
  DomainName: string;
  Title: string | null;
  Logo: string | null;
  Description: string | null;
  Tagline: string | null;
  VnocDomainId: number | bigint | null;
};

type AttrRow = { AttributeName: string; FieldValue: string | null };

/** Look up a domain in the VNOC network. Never throws — returns EMPTY on any issue. */
export async function lookupVnocDomain(domain: string): Promise<VnocMatch> {
  if (!vnocPrisma) return EMPTY;
  const clean = domain.trim().toLowerCase().replace(/^www\./, "");
  if (!clean) return EMPTY;

  try {
    const rows = await vnocPrisma.$queryRawUnsafe<DomainRow[]>(
      `SELECT DomainId, DomainName, Title, Logo, Description, Tagline, VnocDomainId
       FROM Domains
       WHERE DomainName = ? OR DomainName = ?
       ORDER BY (DomainName = ?) DESC
       LIMIT 1`,
      clean,
      `www.${clean}`,
      clean
    );
    const row = rows[0];
    if (!row) return EMPTY;

    const domainId = Number(row.DomainId);

    let socials: DiscoveredSocial[] = [];
    try {
      const attrs = await vnocPrisma.$queryRawUnsafe<AttrRow[]>(
        `SELECT fa.AttributeName, fav.FieldValue
         FROM FrameworkAttributeValues fav
         JOIN FrameworkAttributes fa ON fa.AttributeId = fav.AttributeId
         WHERE fav.DomainId = ?
           AND fav.FieldValue IS NOT NULL AND fav.FieldValue <> '' AND fav.FieldValue <> '0'
           AND fa.AttributeName REGEXP 'facebook|twitter|instagram|linkedin|youtube|tiktok|pinterest|threads|discord|github|reddit'
         LIMIT 40`,
        domainId
      );
      socials = attrs
        .map((a) => normalizeSocialUrl(String(a.FieldValue || "")))
        .filter((u): u is string => !!u)
        .map((url) => ({ platform: platformForUrl(url) || "website", url, source: "vnoc" as const }))
        .filter((s) => s.platform !== "website");
    } catch {
      socials = [];
    }

    const title = (row.Title || "").trim();
    // Generic auto-generated titles are not useful brand names.
    const name =
      title && !/^welcome to /i.test(title) && title !== clean ? title : title || null;

    // For VNOC domains the authoritative logo is served by brandidentity.com.
    // (Domains.Logo / cdn.vnoc.com is preserved in `raw` as a fallback source.)
    const logoUrl = `https://www.brandidentity.com/logo/${clean}`;

    return {
      matched: true,
      vnocDomainId: domainId,
      name,
      logoUrl,
      description: (row.Description || "").trim() || null,
      tagline: (row.Tagline || "").trim() || null,
      socials: dedupeSocials(socials),
      raw: { ...row, DomainId: domainId, VnocDomainId: row.VnocDomainId != null ? Number(row.VnocDomainId) : null },
    };
  } catch (e) {
    console.error("VNOC lookup failed", (e as Error).message);
    return EMPTY;
  }
}

function dedupeSocials(list: DiscoveredSocial[]): DiscoveredSocial[] {
  const seen = new Set<string>();
  const out: DiscoveredSocial[] = [];
  for (const s of list) {
    const key = s.platform;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

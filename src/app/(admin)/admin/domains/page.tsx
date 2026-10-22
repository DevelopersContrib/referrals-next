import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBrandEntitlement } from "@/lib/member-subscription";
import { ROOT_DOMAIN, vercelDomainsEnabled, vercelProjectId } from "@/lib/brand-domains";
import { NETWORK_EMAIL_DOMAIN } from "@/lib/domain-referrer";
import { brandIdentityLogo } from "@/lib/domain-brand";
import { NETWORK_SITES, networkSiteUrl } from "@/lib/network-sites";
import { domainTraffic, vnocAnalyticsEnabled, type DomainTraffic } from "@/lib/vnoc-analytics";
import { DomainActions } from "./domain-actions";

export const metadata = { title: "Domains" };

/** Sign-ups credited to a domain through /go/<domain> (its synthetic referrer rows). */
type ReferrerRow = {
  domain: string;
  total: bigint;
  last_30d: bigint;
  last_7d: bigint;
  last_signup: Date | null;
};

const n = (v: bigint | number | null | undefined) => Number(v ?? 0);
const day = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "–");
const traffic = (t: DomainTraffic | null | undefined) =>
  t ? `${t.pageviews.toLocaleString()} views · ${t.visitors.toLocaleString()} visitors` : "–";

export default async function AdminDomainsPage() {
  const analyticsOn = vnocAnalyticsEnabled();
  const vercelOn = vercelDomainsEnabled();
  const projectId = vercelProjectId();

  const [referrers, subdomains, customDomains, trafficRows] = await Promise.all([
    prisma.$queryRawUnsafe<ReferrerRow[]>(
      `SELECT SUBSTRING_INDEX(r.email, '@', 1) AS domain,
              COUNT(i.id) AS total,
              SUM(CASE WHEN i.date_signedup >= NOW() - INTERVAL 30 DAY THEN 1 ELSE 0 END) AS last_30d,
              SUM(CASE WHEN i.date_signedup >= NOW() - INTERVAL 7 DAY THEN 1 ELSE 0 END) AS last_7d,
              MAX(i.date_signedup) AS last_signup
         FROM campaign_participants r
         LEFT JOIN campaign_participants i ON i.invited_by = r.id
        WHERE r.email LIKE ?
        GROUP BY SUBSTRING_INDEX(r.email, '@', 1)
        ORDER BY last_30d DESC, total DESC`,
      `%@${NETWORK_EMAIL_DOMAIN}`,
    ),
    prisma.brand_subdomains.findMany({
      where: { subdomain: { not: null } },
      orderBy: { id: "desc" },
      select: { id: true, url_id: true, created_by: true, subdomain: true, date_created: true },
    }),
    prisma.brand_whitelabel.findMany({
      where: { domain: { not: null } },
      orderBy: { id: "desc" },
      select: { id: true, url_id: true, created_by: true, domain: true, vercel_identifier: true, date_created: true },
    }),
    Promise.all(
      NETWORK_SITES.map(async (site) => ({
        key: site.key,
        week: await domainTraffic(site.domain, "7d"),
        month: await domainTraffic(site.domain, "30d"),
      })),
    ),
  ]);

  const creditsFor = new Map(referrers.map((r) => [r.domain, r]));
  const trafficFor = new Map(trafficRows.map((t) => [t.key, t]));
  const networkDomains = new Set(NETWORK_SITES.map((s) => s.domain));

  // One row per white-label address, with its brand, owner and whether it's served.
  const brandIds = [...new Set([...subdomains, ...customDomains].map((r) => r.url_id))];
  const brands = brandIds.length
    ? await prisma.member_urls.findMany({
        where: { id: { in: brandIds } },
        select: { id: true, domain: true, member_id: true },
      })
    : [];
  const ownerIds = [...new Set(brands.map((b) => b.member_id))];
  const owners = ownerIds.length
    ? await prisma.members.findMany({ where: { id: { in: ownerIds } }, select: { id: true, email: true } })
    : [];
  const served = new Map(
    await Promise.all(
      brandIds.map(
        async (id) =>
          [id, Boolean((await getBrandEntitlement(id, { applyAdminBypass: false }))?.hideBranding)] as const,
      ),
    ),
  );
  const brandOf = new Map(brands.map((b) => [b.id, b]));
  const emailOf = new Map(owners.map((m) => [m.id, m.email]));

  const addresses = [
    ...customDomains.map((r) => ({
      kind: "custom" as const,
      id: r.id,
      host: r.domain as string,
      brandId: r.url_id,
      added: r.date_created,
      connection: !r.vercel_identifier
        ? "Not connected"
        : r.vercel_identifier === projectId
          ? "This project"
          : "Other project",
    })),
    ...subdomains.map((r) => ({
      kind: "subdomain" as const,
      id: r.id,
      host: `${r.subdomain}.${ROOT_DOMAIN}`,
      brandId: r.url_id,
      added: r.date_created,
      connection: "This project",
    })),
  ];
  const servedCount = addresses.filter((a) => served.get(a.brandId)).length;
  const otherReferrers = referrers.filter((r) => !networkDomains.has(r.domain));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domains</h1>
        <p className="text-sm text-muted-foreground">
          Our network sites, the domains sending sign-ups through /go, and the white-label addresses brands use.
        </p>
      </div>

      {(!analyticsOn || !vercelOn) && (
        <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {!analyticsOn && (
            <p>
              <strong>Traffic is off.</strong> Add VNOC_ANALYTICS_KEY in Vercel to show page views from VNOC Analytics.
            </p>
          )}
          {!vercelOn && (
            <p>
              <strong>Address checks are off.</strong> Add VERCEL_API_TOKEN in Vercel to check DNS and connect or
              disconnect addresses.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Network sites live", value: `${NETWORK_SITES.filter((s) => s.enabled).length} of ${NETWORK_SITES.length}` },
          { label: "Referring domains", value: referrers.length },
          { label: "Sign-ups via /go (30 days)", value: referrers.reduce((sum, r) => sum + n(r.last_30d), 0) },
          { label: "White-label addresses", value: `${addresses.length} (${servedCount} served)` },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{s.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network sites</CardTitle>
          <p className="text-sm text-muted-foreground">
            Our own referral domains served by this app with their own look. Accounts and billing stay on
            referrals.com. A site goes live when <code>enabled</code> is true in src/lib/network-sites.ts.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Design</TableHead>
                <TableHead>Traffic, 7 days</TableHead>
                <TableHead>Traffic, 30 days</TableHead>
                <TableHead className="text-right">Sign-ups (7d / 30d / all)</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {NETWORK_SITES.map((site) => {
                const credits = creditsFor.get(site.domain);
                const t = trafficFor.get(site.key);
                return (
                  <TableRow key={site.key}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={brandIdentityLogo(site.domain)} alt="" className="h-6 w-20 object-contain object-left" />
                        <div>
                          <a href={networkSiteUrl(site)} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                            {site.domain}
                          </a>
                          <span className="block text-xs text-muted-foreground">{site.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.enabled ? <Badge>Live</Badge> : <Badge variant="outline">Off</Badge>}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{site.design}</TableCell>
                    <TableCell className="text-xs">{analyticsOn ? traffic(t?.week) : "–"}</TableCell>
                    <TableCell className="text-xs">{analyticsOn ? traffic(t?.month) : "–"}</TableCell>
                    <TableCell className="text-right">
                      {n(credits?.last_7d)} / {n(credits?.last_30d)} / {n(credits?.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DomainActions kind="network" id={site.key} host={site.domain} canCheck={vercelOn} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>White-label addresses</CardTitle>
          <p className="text-sm text-muted-foreground">
            Subdomains like brand.{ROOT_DOMAIN} and custom domains like refer.theirsite.com that brands connected. An address is only served
            while its brand is paid or a network brand.
          </p>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No white-label addresses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand and owner</TableHead>
                  <TableHead>Served</TableHead>
                  <TableHead>Vercel</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((a) => {
                  const brand = brandOf.get(a.brandId);
                  const isServed = served.get(a.brandId);
                  return (
                    <TableRow key={`${a.kind}-${a.id}`}>
                      <TableCell className="text-xs">
                        <a href={`https://${a.host}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                          {a.host}
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">{a.kind === "custom" ? "Custom domain" : "Subdomain"}</TableCell>
                      <TableCell className="text-xs">
                        {brand ? (
                          <Link href={`/admin/brands/${brand.id}/edit`} className="hover:underline">
                            {brand.domain || `#${brand.id}`}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">#{a.brandId} (deleted)</span>
                        )}
                        {brand && (
                          <Link
                            href={`/admin/members/${brand.member_id}`}
                            className="block text-muted-foreground hover:underline"
                          >
                            {emailOf.get(brand.member_id) || `#${brand.member_id}`}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        {isServed ? (
                          <Badge>Yes</Badge>
                        ) : (
                          <Badge variant="outline" title="Brand isn't paid, so the address shows referrals.com instead">
                            No, unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{a.connection}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{day(a.added)}</TableCell>
                      <TableCell className="text-right">
                        <DomainActions kind={a.kind} id={String(a.id)} host={a.host} canCheck={vercelOn} canDisconnect />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referring domains</CardTitle>
          <p className="text-sm text-muted-foreground">
            Other domains that send people to referrals.com/go/&lt;domain&gt;, with the sign-ups credited to them.
            A burst of sign-ups from one domain is often the bot wave, not real people.
          </p>
        </CardHeader>
        <CardContent>
          {otherReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other referring domains yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">7 days</TableHead>
                  <TableHead className="text-right">30 days</TableHead>
                  <TableHead className="text-right">All time</TableHead>
                  <TableHead>Last sign-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherReferrers.slice(0, 100).map((r) => (
                  <TableRow key={r.domain}>
                    <TableCell className="text-xs">
                      <a href={`https://${r.domain}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                        {r.domain}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">{n(r.last_7d)}</TableCell>
                    <TableCell className="text-right">{n(r.last_30d)}</TableCell>
                    <TableCell className="text-right">{n(r.total)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{day(r.last_signup)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {otherReferrers.length > 100 && (
            <p className="mt-2 text-xs text-muted-foreground">Showing the top 100 of {otherReferrers.length}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

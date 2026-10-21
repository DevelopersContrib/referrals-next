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
import { reoonEnabled } from "@/lib/reoon";

export const metadata = { title: "Sign-ups" };

type Props = { searchParams: Promise<{ show?: string }> };

type WeekRow = {
  week_start: Date | string;
  total: bigint;
  verified: bigint;
  with_brand: bigint;
  bot_like: bigint;
};

type DayRow = { day: Date | string; total: bigint; verified: bigint; bot_like: bigint };

type CheckRow = { week_start: Date | string; allowed: bigint; risky: bigint; blocked: bigint };

/**
 * A sign-up "looks like a bot" when its name is a single lowercase word (the
 * random Latin words the late-2026 sign-up bot uses), it never verified its
 * email and it never added a brand. It's a signal for the report, not a block.
 */
const BOT_LIKE_SQL = `REGEXP_LIKE(m.name, '^[a-z]+$', 'c') AND COALESCE(m.is_verified, 0) = 0
  AND b.member_id IS NULL`;

/** Brand count per member, scanned once and joined (member_urls.member_id has no index). */
const BRANDS_JOIN = `LEFT JOIN (SELECT member_id, COUNT(*) AS brands FROM member_urls GROUP BY member_id) b
  ON b.member_id = m.id`;

const n = (v: bigint | number | null | undefined) => Number(v ?? 0);
const day = (v: Date | string) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

/** Request time for this server render (kept out of the component body). */
function requestTime(): number {
  return Date.now();
}

export default async function SignupsReportPage({ searchParams }: Props) {
  const { show } = await searchParams;
  const now = requestTime();
  const since12w = new Date(now - 84 * 86_400_000);
  const since14d = new Date(now - 14 * 86_400_000);

  const [weeks, days, checks, recent] = await Promise.all([
    prisma.$queryRawUnsafe<WeekRow[]>(
      `SELECT MIN(DATE(m.date_signedup)) AS week_start,
              COUNT(*) AS total,
              SUM(CASE WHEN m.is_verified = 1 THEN 1 ELSE 0 END) AS verified,
              SUM(CASE WHEN b.member_id IS NOT NULL THEN 1 ELSE 0 END) AS with_brand,
              SUM(CASE WHEN ${BOT_LIKE_SQL} THEN 1 ELSE 0 END) AS bot_like
         FROM members m
         ${BRANDS_JOIN}
        WHERE m.date_signedup >= ?
        GROUP BY YEARWEEK(m.date_signedup, 3)
        ORDER BY week_start DESC`,
      since12w,
    ),
    prisma.$queryRawUnsafe<DayRow[]>(
      `SELECT DATE(m.date_signedup) AS day,
              COUNT(*) AS total,
              SUM(CASE WHEN m.is_verified = 1 THEN 1 ELSE 0 END) AS verified,
              SUM(CASE WHEN ${BOT_LIKE_SQL} THEN 1 ELSE 0 END) AS bot_like
         FROM members m
         ${BRANDS_JOIN}
        WHERE m.date_signedup >= ?
        GROUP BY DATE(m.date_signedup)
        ORDER BY day DESC`,
      since14d,
    ),
    prisma
      .$queryRawUnsafe<CheckRow[]>(
        `SELECT MIN(DATE(checked_at)) AS week_start,
                SUM(CASE WHEN verdict = 'allow' THEN 1 ELSE 0 END) AS allowed,
                SUM(CASE WHEN verdict = 'risky' THEN 1 ELSE 0 END) AS risky,
                SUM(CASE WHEN verdict = 'block' THEN 1 ELSE 0 END) AS blocked
           FROM member_email_checks
          WHERE checked_at >= ?
          GROUP BY YEARWEEK(checked_at, 3)
          ORDER BY week_start DESC`,
        since12w,
      )
      .catch(() => null),
    prisma.$queryRawUnsafe<
      { id: number; email: string | null; name: string | null; date_signedup: Date; is_verified: number | boolean | null; brands: bigint; bot_like: bigint | number }[]
    >(
      `SELECT m.id, m.email, m.name, m.date_signedup, m.is_verified,
              COALESCE(b.brands, 0) AS brands,
              (CASE WHEN ${BOT_LIKE_SQL} THEN 1 ELSE 0 END) AS bot_like
         FROM members m
         ${BRANDS_JOIN}
        WHERE m.date_signedup >= ?
          ${show === "real" ? `AND NOT (${BOT_LIKE_SQL})` : show === "bots" ? `AND (${BOT_LIKE_SQL})` : ""}
        ORDER BY m.id DESC
        LIMIT 100`,
      since14d,
    ),
  ]);

  const emailChecks = recent.length
    ? await prisma.member_email_checks
        .findMany({
          where: { member_id: { in: recent.map((r) => Number(r.id)) } },
          select: { member_id: true, status: true, verdict: true },
        })
        .catch(() => [])
    : [];
  const checkOf = new Map(emailChecks.map((c) => [c.member_id, c]));

  const week0 = weeks[0];
  const thisWeek = { total: n(week0?.total), bots: n(week0?.bot_like) };
  const turnstileOn = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
  const reoonOn = reoonEnabled();
  const checksByWeek = new Map((checks ?? []).map((c) => [day(c.week_start), c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sign-ups</h1>
        <p className="text-sm text-muted-foreground">
          New accounts, how many verified their email or added a brand, and how many look like bots.
        </p>
      </div>

      {(!turnstileOn || !reoonOn) && (
        <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {!turnstileOn && (
            <p>
              <strong>Bot check is off.</strong> Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in Vercel
              to turn on the Cloudflare Turnstile check on the sign-up form.
            </p>
          )}
          {!reoonOn && (
            <p>
              <strong>Email check is off.</strong> Add REOON_API_KEY in Vercel to block invalid and throwaway emails at
              sign-up.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "This week", value: thisWeek.total },
          { label: "Look like bots", value: `${thisWeek.bots} (${pct(thisWeek.bots, thisWeek.total)})` },
          { label: "Real this week", value: thisWeek.total - thisWeek.bots },
          { label: "Verified this week", value: n(week0?.verified) },
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
          <CardTitle>By week (last 12 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week of</TableHead>
                <TableHead className="text-right">Sign-ups</TableHead>
                <TableHead className="text-right">Look like bots</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Verified</TableHead>
                <TableHead className="text-right">Added a brand</TableHead>
                <TableHead className="text-right">Email check: ok / risky / blocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((w) => {
                const total = n(w.total);
                const bots = n(w.bot_like);
                const c = checksByWeek.get(day(w.week_start));
                return (
                  <TableRow key={day(w.week_start)}>
                    <TableCell>{day(w.week_start)}</TableCell>
                    <TableCell className="text-right font-medium">{total}</TableCell>
                    <TableCell className="text-right">
                      {bots} <span className="text-muted-foreground">({pct(bots, total)})</span>
                    </TableCell>
                    <TableCell className="text-right">{total - bots}</TableCell>
                    <TableCell className="text-right">{n(w.verified)}</TableCell>
                    <TableCell className="text-right">{n(w.with_brand)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {c ? `${n(c.allowed)} / ${n(c.risky)} / ${n(c.blocked)}` : "–"}
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
          <CardTitle>By day (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {days.map((d) => {
            const total = n(d.total);
            const bots = n(d.bot_like);
            return (
              <div key={day(d.day)} className="min-w-[7rem] rounded-lg border p-3 text-sm">
                <p className="text-xs text-muted-foreground">{day(d.day)}</p>
                <p className="text-lg font-semibold">{total}</p>
                <p className="text-xs text-muted-foreground">
                  {total - bots} real · {n(d.verified)} verified
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Recent sign-ups (last 14 days)</CardTitle>
          <div className="flex gap-1.5 text-xs">
            {[
              { key: undefined, label: "All" },
              { key: "real", label: "Real" },
              { key: "bots", label: "Look like bots" },
            ].map((f) => (
              <Link
                key={f.label}
                href={f.key ? `/admin/signups?show=${f.key}` : "/admin/signups"}
                className={`rounded-full border px-2.5 py-1 ${show === f.key ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Joined</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Brands</TableHead>
                <TableHead>Email check</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => {
                const check = checkOf.get(Number(r.id));
                return (
                  <TableRow key={Number(r.id)}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.date_signedup).toISOString().slice(0, 16).replace("T", " ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link href={`/admin/members/${Number(r.id)}`} className="font-medium hover:underline">
                        {r.email}
                      </Link>
                      <span className="block text-muted-foreground">{r.name}</span>
                    </TableCell>
                    <TableCell>{r.is_verified ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                    <TableCell>{n(r.brands)}</TableCell>
                    <TableCell className="text-xs">
                      {check ? (
                        <Badge variant={check.verdict === "allow" ? "secondary" : "outline"}>{check.status}</Badge>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {n(r.bot_like) ? <Badge variant="destructive">Looks like a bot</Badge> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

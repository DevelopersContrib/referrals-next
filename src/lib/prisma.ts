import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Prefer a pooler URL in production (Vercel / RDS Proxy / PlanetScale). */
export function resolveDatabaseUrl(): string | undefined {
  const pooled = process.env.DATABASE_URL_POOLED?.trim();
  const direct = process.env.DATABASE_URL?.trim();
  return pooled || direct;
}

function looksPooled(url: string): boolean {
  return (
    /[?&]connection_limit=\d+/i.test(url) ||
    /\.psdb\.cloud|planetscale|pooler\.|rdsproxy|rds-proxy|pgbouncer=true/i.test(
      url,
    )
  );
}

/**
 * Serverless-safe defaults: one connection per isolate so polling + pipeline
 * modules don't exhaust a small shared MySQL max_connections (e.g. 5).
 * Skip when the URL already targets a pooler or sets connection_limit.
 */
export function withPoolParams(raw: string): string {
  if (looksPooled(raw)) return raw;

  const hash = raw.indexOf("#");
  const withoutHash = hash === -1 ? raw : raw.slice(0, hash);
  const q = withoutHash.indexOf("?");
  const base = q === -1 ? withoutHash : withoutHash.slice(0, q);
  const params = new URLSearchParams(q === -1 ? "" : withoutHash.slice(q + 1));
  const limit = process.env.DATABASE_CONNECTION_LIMIT?.trim() || "1";
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT?.trim() || "30";
  params.set("connection_limit", limit);
  params.set("pool_timeout", poolTimeout);
  const query = params.toString();
  const suffix = hash === -1 ? "" : raw.slice(hash);
  return query ? `${base}?${query}${suffix}` : `${base}${suffix}`;
}

function createPrisma() {
  const url = resolveDatabaseUrl();
  if (!url) return new PrismaClient();
  return new PrismaClient({
    datasources: { db: { url: withPoolParams(url) } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

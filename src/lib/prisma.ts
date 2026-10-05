import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** One connection per serverless isolate, with a longer wait before pool timeout. */
export function withPoolParams(raw: string): string {
  const hash = raw.indexOf("#");
  const withoutHash = hash === -1 ? raw : raw.slice(0, hash);
  const q = withoutHash.indexOf("?");
  const base = q === -1 ? withoutHash : withoutHash.slice(0, q);
  const params = new URLSearchParams(q === -1 ? "" : withoutHash.slice(q + 1));
  params.set("connection_limit", "1");
  params.set("pool_timeout", "20");
  const query = params.toString();
  const suffix = hash === -1 ? "" : raw.slice(hash);
  return query ? `${base}?${query}${suffix}` : `${base}${suffix}`;
}

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient();
  return new PrismaClient({
    datasources: { db: { url: withPoolParams(url) } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = prisma;

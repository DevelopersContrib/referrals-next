import { PrismaClient } from "@prisma/client";

const globalForVnoc = globalThis as unknown as {
  vnocPrisma: PrismaClient | undefined;
};

function createVnocPrisma() {
  const url = process.env.VNOC_DATABASE_URL;
  if (!url) return null;
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

export const vnocPrisma = globalForVnoc.vnocPrisma ?? createVnocPrisma();

if (process.env.NODE_ENV !== "production" && vnocPrisma) {
  globalForVnoc.vnocPrisma = vnocPrisma;
}

import { PrismaClient } from "@prisma/client";
import { withPoolParams } from "@/lib/prisma";

const globalForVnoc = globalThis as unknown as {
  vnocPrisma: PrismaClient | undefined;
};

function createVnocPrisma() {
  const url = process.env.VNOC_DATABASE_URL;
  if (!url) return null;
  return new PrismaClient({
    datasources: { db: { url: withPoolParams(url) } },
  });
}

export const vnocPrisma = globalForVnoc.vnocPrisma ?? createVnocPrisma();

if (vnocPrisma) {
  globalForVnoc.vnocPrisma = vnocPrisma;
}

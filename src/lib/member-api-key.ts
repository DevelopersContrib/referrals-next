import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function newReferralsApiKeyValue() {
  return `ref_${randomBytes(24).toString("hex")}`;
}

export async function createMemberApiKey(memberId: number) {
  return prisma.member_keys.create({
    data: {
      api_key: newReferralsApiKeyValue(),
      userid: memberId,
      date_generated: new Date(),
    },
  });
}

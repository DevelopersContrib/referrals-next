import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Tools now lives under each brand (brand menu → Tools). */
export default async function ToolsRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/tools");
  const brand = await prisma.member_urls.findFirst({
    where: { member_id: parseInt(session.user.id, 10) },
    orderBy: { date_added: "asc" },
    select: { id: true },
  });
  redirect(brand ? `/brands/${brand.id}/tools` : "/brands/new");
}

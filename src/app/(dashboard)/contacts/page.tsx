import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Contacts now live under each brand (brand menu → Contacts). */
export default async function ContactsRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/contacts");
  const brand = await prisma.member_urls.findFirst({
    where: { member_id: parseInt(session.user.id, 10) },
    orderBy: { date_added: "asc" },
    select: { id: true },
  });
  redirect(brand ? `/brands/${brand.id}/contacts` : "/brands/new");
}

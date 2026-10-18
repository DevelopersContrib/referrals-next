import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactsView } from "@/components/dashboard/contacts-view";

export const metadata: Metadata = { title: "Contacts", robots: { index: false, follow: false } };

export default async function BrandContactsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { brandId: raw } = await params;
  const brandId = parseInt(raw, 10);
  if (Number.isNaN(brandId)) notFound();

  const brand = await prisma.member_urls.findFirst({
    where: { id: brandId, member_id: parseInt(session.user.id, 10) },
    select: { id: true, domain: true },
  });
  if (!brand) notFound();

  return <ContactsView brandId={brand.id} brandName={brand.domain} />;
}

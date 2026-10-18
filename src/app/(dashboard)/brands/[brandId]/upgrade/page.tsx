import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * One publish step for every "pay $9" button: checkout for this brand, carrying
 * its newest campaign so paying actually makes that campaign live.
 */
export default async function UpgradeBrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const id = parseInt(brandId, 10);
  if (Number.isNaN(id)) redirect("/brands");

  const brand = await prisma.member_urls.findUnique({
    where: { id },
    select: { id: true, member_id: true },
  });
  if (!brand || brand.member_id !== parseInt(session.user.id, 10)) {
    redirect("/brands");
  }

  // The brand's billing page shows monthly, yearly and agency, each going
  // to checkout with this brand and its newest campaign.
  redirect(`/brands/${brand.id}/billing`);
}

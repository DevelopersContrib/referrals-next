import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DEFAULT_PAID_PLAN_ID } from "@/lib/billing-constants";

/** REF-J3: orphan upgrade page → existing Growth checkout */
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

  redirect(`/billing/plan/${DEFAULT_PAID_PLAN_ID}?brandId=${brand.id}`);
}

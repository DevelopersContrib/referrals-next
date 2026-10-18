import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BannerManager } from "@/components/tools/banner-manager";

export default async function BannersToolPage({ searchParams }: { searchParams?: Promise<{ brandId?: string }> }) {
	const session = await auth();
	if (!session?.user?.id) redirect("/signin");
	const memberId = parseInt(session.user.id, 10);
	// Opened from a brand's Tools page: only that brand's campaigns.
	const brandIdRaw = parseInt((await searchParams)?.brandId || "", 10);
	const brandId = Number.isFinite(brandIdRaw) && brandIdRaw > 0 ? brandIdRaw : null;

	const campaigns = await prisma.member_campaigns.findMany({
		where: { member_id: memberId, ...(brandId ? { url_id: brandId } : {}) },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Banner Management</h1>
				<p className="mt-1 text-muted-foreground">
					Upload and manage promotional banners for your referral campaigns.
				</p>
			</div>

			<BannerManager campaigns={campaigns} />
		</div>
	);
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BannerManager } from "@/components/tools/banner-manager";

export default async function BannersToolPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/signin");
	const memberId = parseInt(session.user.id, 10);

	const campaigns = await prisma.member_campaigns.findMany({
		where: { member_id: memberId },
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

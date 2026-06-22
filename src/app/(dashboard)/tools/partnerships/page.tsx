import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnershipsBrowser } from "@/components/tools/partnerships-browser";

export default async function PartnershipsToolPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/signin");
	const memberId = parseInt(session.user.id, 10);

	const partnerBrands = await prisma.member_urls.findMany({
		where: { member_id: { not: memberId } },
		select: { id: true, domain: true, logo_url: true },
		orderBy: { date_added: "desc" },
		take: 24,
	});

	const brandIds = partnerBrands.map((b) => b.id);
	const campaignCounts = brandIds.length
		? await prisma.member_campaigns.groupBy({
				by: ["url_id"],
				where: { url_id: { in: brandIds } },
				_count: { id: true },
			})
		: [];

	const countMap = new Map(
		campaignCounts.map((c) => [c.url_id, c._count.id])
	);

	const brands = partnerBrands.map((b) => ({
		id: b.id,
		domain: b.domain,
		logoUrl: b.logo_url,
		campaignCount: countMap.get(b.id) || 0,
	}));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Partnerships</h1>
				<p className="mt-1 text-muted-foreground">
					Discover and manage partnerships to amplify your referral programs.
				</p>
			</div>

			<PartnershipsBrowser brands={brands} />
		</div>
	);
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { SearchIcon, HandshakeIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

export type PartnerBrand = {
	id: number;
	domain: string;
	logoUrl: string | null;
	campaignCount: number;
};

type PartnershipRequest = {
	id: string;
	brandDomain: string;
	status: "Pending" | "Accepted" | "Declined";
};

type PartnershipsBrowserProps = {
	brands: PartnerBrand[];
};

const STATUS_STYLES: Record<
	PartnershipRequest["status"],
	string
> = {
	Pending: "bg-[#fff8e1] text-[#856404]",
	Accepted: "bg-[#e8f5e9] text-[#28a745]",
	Declined: "bg-[#fce4ec] text-[#dc3545]",
};

export function PartnershipsBrowser({ brands }: PartnershipsBrowserProps) {
	const [search, setSearch] = useState("");
	const [requests, setRequests] = useState<PartnershipRequest[]>([]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return brands;
		return brands.filter((b) => b.domain.toLowerCase().includes(q));
	}, [brands, search]);

	function handleRequest(brand: PartnerBrand) {
		const exists = requests.some(
			(r) => r.brandDomain === brand.domain && r.status === "Pending"
		);
		if (exists) {
			toast.info("Request already pending");
			return;
		}
		setRequests((prev) => [
			{
				id: crypto.randomUUID(),
				brandDomain: brand.domain,
				status: "Pending",
			},
			...prev,
		]);
		toast.success(`Partnership request sent to ${brand.domain}`);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Find Partners</CardTitle>
					<CardDescription>
						Browse other brands on Referrals.com and propose cross-promotion
						partnerships.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="relative">
						<SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search brands by domain..."
							className="ps-9"
						/>
					</div>

					{filtered.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							No brands found matching your search.
						</p>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filtered.map((brand) => (
								<div
									key={brand.id}
									className="rounded-lg border border-[#ebeef0] p-4 transition-colors hover:border-brand/30"
								>
									<div className="flex items-center gap-3">
										{brand.logoUrl ? (
											<div className="relative size-10 shrink-0">
												<Image
													src={brand.logoUrl}
													alt={brand.domain}
													fill
													className="rounded-md border border-[#ebeef0] object-contain p-0.5"
													unoptimized
												/>
											</div>
										) : (
											<div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand/10 text-sm font-bold uppercase text-brand">
												{brand.domain.charAt(0)}
											</div>
										)}
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{brand.domain}</p>
											<p className="text-xs text-muted-foreground">
												{brand.campaignCount} campaign
												{brand.campaignCount !== 1 ? "s" : ""}
											</p>
										</div>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="mt-3 min-h-11 w-full gap-2"
										onClick={() => handleRequest(brand)}
									>
										<HandshakeIcon className="size-4" />
										Request Partnership
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">My Partnership Requests</CardTitle>
					<CardDescription>
						Track the status of your partnership proposals.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{requests.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">
							No partnership requests yet. Browse brands above to get
							started.
						</p>
					) : (
						<div className="space-y-2">
							{requests.map((req) => (
								<div
									key={req.id}
									className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ebeef0] px-4 py-3"
								>
									<span className="font-medium">{req.brandDomain}</span>
									<Badge
										className={`border-0 font-medium ${STATUS_STYLES[req.status]}`}
									>
										{req.status}
									</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>How Partnerships Work</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 sm:grid-cols-3">
						<div>
							<h3 className="font-medium text-gray-900">1. Connect</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Find brands that complement yours and send a partnership
								request.
							</p>
						</div>
						<div>
							<h3 className="font-medium text-gray-900">2. Collaborate</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Set up cross-promotion campaigns that benefit both audiences.
							</p>
						</div>
						<div>
							<h3 className="font-medium text-gray-900">3. Grow Together</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Track shared referrals and measure the impact of your
								partnership.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { useState } from "react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type AdsManagerProps = {
	campaigns: { id: number; name: string }[];
};

export function AdsManager({ campaigns }: AdsManagerProps) {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [campaign, setCampaign] = useState("");
	const [budget, setBudget] = useState("");
	const [audience, setAudience] = useState("");
	const [duration, setDuration] = useState("7");

	const previewCampaign =
		campaigns.find((c) => String(c.id) === campaign)?.name ||
		"Your Campaign";

	function handleSubmit() {
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setOpen(false);
			toast.info("Ad creation is in beta — coming soon!");
		}, 600);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<Badge variant="secondary">Beta</Badge>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger
						render={
							<Button className="min-h-11 gap-2 bg-brand hover:bg-brand-hover">
								<PlusIcon className="size-4" />
								Create Ad Campaign
							</Button>
						}
					/>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>Create Ad Campaign</DialogTitle>
							<DialogDescription>
								Design an ad to promote your referral program across the
								Referrals.com network.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-2">
							<div className="space-y-2">
								<Label htmlFor="ad-campaign">Campaign to promote</Label>
								<select
									id="ad-campaign"
									value={campaign}
									onChange={(e) => setCampaign(e.target.value)}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								>
									<option value="">Select a campaign</option>
									{campaigns.map((c) => (
										<option key={c.id} value={String(c.id)}>
											{c.name}
										</option>
									))}
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ad-budget">Daily budget ($)</Label>
								<Input
									id="ad-budget"
									type="number"
									min="1"
									value={budget}
									onChange={(e) => setBudget(e.target.value)}
									placeholder="10"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ad-audience">Target audience</Label>
								<Input
									id="ad-audience"
									value={audience}
									onChange={(e) => setAudience(e.target.value)}
									placeholder="e.g. Small business owners, US"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ad-duration">Duration (days)</Label>
								<Input
									id="ad-duration"
									type="number"
									min="1"
									value={duration}
									onChange={(e) => setDuration(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								className="min-h-11 bg-brand hover:bg-brand-hover"
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting && (
									<Loader2Icon className="size-4 animate-spin" />
								)}
								Create Ad
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card>
					<CardContent className="py-6 text-center">
						<p className="text-3xl font-bold">0</p>
						<p className="text-sm text-muted-foreground">Active Ads</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="py-6 text-center">
						<p className="text-3xl font-bold">0</p>
						<p className="text-sm text-muted-foreground">Impressions</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="py-6 text-center">
						<p className="text-3xl font-bold">0</p>
						<p className="text-sm text-muted-foreground">Clicks</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Your Ad Campaigns</CardTitle>
						<CardDescription>
							Create ad campaigns to promote your referral program across the
							Referrals.com network.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="py-8 text-center text-muted-foreground">
							No ad campaigns yet. Click Create Ad Campaign to get started.
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ad Preview</CardTitle>
						<CardDescription>
							How your ad would appear on the platform
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="rounded-lg border border-[#ebeef0] bg-white p-4 shadow-sm">
							<div className="mb-2 flex min-w-0 items-center gap-2">
								<div className="size-8 shrink-0 rounded-full bg-brand/10" />
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">Sponsored</p>
									<p className="truncate text-sm font-semibold">
										{previewCampaign}
									</p>
								</div>
							</div>
							<div className="aspect-[2/1] rounded-md bg-gradient-to-br from-brand/10 to-[#f7f8fa]" />
							<p className="mt-2 text-sm font-medium">
								Join our referral program — earn rewards!
							</p>
							<p className="text-xs text-muted-foreground">
								{budget ? `$${budget}/day` : "Set budget"} &middot;{" "}
								{duration} days
							</p>
							<Button
								type="button"
								size="sm"
								className="mt-3 bg-brand hover:bg-brand-hover"
								disabled
							>
								Learn More
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

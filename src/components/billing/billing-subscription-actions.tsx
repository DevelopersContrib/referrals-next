"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type BillingSubscriptionActionsProps = {
	canCancel: boolean;
	canReactivate: boolean;
};

export function BillingSubscriptionActions({
	canCancel,
	canReactivate,
}: BillingSubscriptionActionsProps) {
	const router = useRouter();
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [reactivating, setReactivating] = useState(false);

	if (!canCancel && !canReactivate) return null;

	async function handleCancel() {
		setCancelling(true);
		try {
			const res = await fetch("/api/billing/cancel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Cancellation failed");
				return;
			}
			toast.success("Subscription cancelled. Access continues until period end.");
			setCancelOpen(false);
			router.refresh();
		} catch {
			toast.error("Cancellation failed");
		} finally {
			setCancelling(false);
		}
	}

	async function handleReactivate() {
		setReactivating(true);
		try {
			const res = await fetch("/api/billing/reactivate", {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Reactivation failed");
				return;
			}
			toast.success("Subscription reactivated successfully.");
			router.refresh();
		} catch {
			toast.error("Reactivation failed");
		} finally {
			setReactivating(false);
		}
	}

	return (
		<div className="mt-4 flex flex-wrap gap-3">
			{canCancel && (
				<>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
						onClick={() => setCancelOpen(true)}
					>
						Cancel Subscription
					</Button>
					<Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Cancel subscription?</DialogTitle>
								<DialogDescription>
									Are you sure you want to cancel? You&apos;ll keep access
									until your billing period ends.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter className="gap-2 sm:gap-0">
								<Button
									type="button"
									variant="outline"
									onClick={() => setCancelOpen(false)}
									disabled={cancelling}
								>
									Keep Subscription
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={handleCancel}
									disabled={cancelling}
									className="min-h-11"
								>
									{cancelling && (
										<Loader2Icon className="size-4 animate-spin" />
									)}
									Confirm Cancel
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</>
			)}
			{canReactivate && (
				<Button
					type="button"
					className="min-h-11 bg-brand hover:bg-brand-hover"
					onClick={handleReactivate}
					disabled={reactivating}
				>
					{reactivating && (
						<Loader2Icon className="size-4 animate-spin" />
					)}
					Reactivate Subscription
				</Button>
			)}
		</div>
	);
}

import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BillingErrorBanner } from "@/components/billing/billing-error-banner";
import { BillingSubscriptionActions } from "@/components/billing/billing-subscription-actions";

export default async function BillingPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/signin");
	const memberId = parseInt(session.user.id, 10);
	const { error } = await searchParams;

	const member = await prisma.members.findUnique({ where: { id: memberId } });
	const plans = await prisma.plans.findMany({ orderBy: { id: "asc" } });
	const currentSubscription = await prisma.member_plan.findFirst({
		where: { member_id: memberId },
		orderBy: { id: "desc" },
	});
	const payments = await prisma.member_payment.findMany({
		where: { member_id: memberId },
		orderBy: { id: "desc" },
		take: 10,
	});

	const activePlanId = member?.plan_id || 0;
	const activePlan = plans.find((p) => p.id === activePlanId);
	const isExpired = member?.plan_expiry
		? new Date(member.plan_expiry) < new Date()
		: true;

	const isCancelled = Boolean(currentSubscription?.agreement_cancel);
	const hasPaidPlan = activePlanId > 0;
	const canCancel =
		hasPaidPlan &&
		!isExpired &&
		!isCancelled &&
		Boolean(currentSubscription?.paypal_agreement_id);
	const canReactivate = isCancelled && !isExpired;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Billing & Subscription</h1>

			<Suspense fallback={null}>
				<BillingErrorBanner initialError={error} />
			</Suspense>

			<Card>
				<CardHeader>
					<CardTitle>Current Plan</CardTitle>
					<CardDescription>
						{activePlan ? activePlan.name : "No active plan"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap items-center gap-4">
						<Badge variant={isExpired ? "destructive" : "default"}>
							{isExpired
								? "Expired"
								: isCancelled
									? "Cancelled"
									: "Active"}
						</Badge>
						{member?.plan_expiry && (
							<span className="text-sm text-muted-foreground">
								{isExpired ? "Expired" : "Expires"}{" "}
								{new Date(member.plan_expiry).toLocaleDateString()}
							</span>
						)}
					</div>
					{currentSubscription?.paypal_agreement_id && (
						<p className="mt-2 break-all font-mono text-xs text-muted-foreground">
							Agreement: {currentSubscription.paypal_agreement_id}
						</p>
					)}
					<BillingSubscriptionActions
						canCancel={canCancel}
						canReactivate={canReactivate}
					/>
				</CardContent>
			</Card>

			<div>
				<h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
					{plans.map((plan) => (
						<Card
							key={plan.id}
							className={
								activePlan?.id === plan.id
									? "border-2 border-brand"
									: ""
							}
						>
							<CardHeader>
								<CardTitle>{plan.name}</CardTitle>
								<CardDescription>
									${(plan.price || 0).toFixed(2)}/{plan.unit || "month"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="mb-4 space-y-1 text-sm text-muted-foreground">
									<li>Up to {plan.no_of_domains || "unlimited"} brands</li>
									<li>
										{plan.campaigns_participants || "unlimited"}{" "}
										participants/campaign
									</li>
									<li>{plan.days || 30} days</li>
								</ul>
								{activePlan?.id !== plan.id ? (
									(plan.price || 0) > 0 ? (
										<Link
											href={`/billing/plan/${plan.id}`}
											className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-hover sm:w-auto"
										>
											Pay with card or PayPal
										</Link>
									) : (
										<span className="inline-flex min-h-11 items-center rounded-lg border border-[#ebeef0] px-4 py-2 text-sm text-muted-foreground">
											Included in trial / free forever
										</span>
									)
								) : (
									<Badge>Current Plan</Badge>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Payment History</CardTitle>
				</CardHeader>
				<CardContent>
					{payments.length === 0 ? (
						<p className="text-sm text-muted-foreground">No payments yet.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[480px] text-sm">
								<thead>
									<tr className="border-b">
										<th className="py-2 text-left">Date</th>
										<th className="py-2 text-left">Amount</th>
										<th className="py-2 text-left">Status</th>
										<th className="py-2 text-left">Transaction</th>
									</tr>
								</thead>
								<tbody>
									{payments.map((payment) => (
										<tr key={payment.id} className="border-b">
											<td className="py-2">
												{new Date(
													payment.datetime_created
												).toLocaleDateString()}
											</td>
											<td className="py-2">
												${(payment.amount || 0).toFixed(2)}{" "}
												{payment.currency || "USD"}
											</td>
											<td className="py-2">
												<Badge
													variant={
														payment.status === "completed"
															? "default"
															: "secondary"
													}
												>
													{payment.status || "pending"}
												</Badge>
											</td>
											<td className="max-w-[150px] truncate py-2 font-mono text-xs">
												{payment.transaction_id || "—"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {activePlan ? activePlan.name : "No active plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={isExpired ? "destructive" : "default"}>
              {isExpired ? "Expired" : "Active"}
            </Badge>
            {member?.plan_expiry && (
              <span className="text-sm text-muted-foreground">
                {isExpired ? "Expired" : "Expires"}{" "}
                {new Date(member.plan_expiry).toLocaleDateString()}
              </span>
            )}
          </div>
          {currentSubscription?.paypal_agreement_id && (
            <p className="mt-2 text-xs text-muted-foreground font-mono">
              Agreement: {currentSubscription.paypal_agreement_id}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={activePlan?.id === plan.id ? "border-blue-500 border-2" : ""}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  ${(plan.price || 0).toFixed(2)}/{plan.unit || "month"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>Up to {plan.no_of_domains || "unlimited"} brands</li>
                  <li>{plan.campaigns_participants || "unlimited"} participants/campaign</li>
                  <li>{plan.days || 30} days</li>
                </ul>
                {activePlan?.id !== plan.id ? (
                  <Link
                    href={`/billing/plan/${plan.id}`}
                    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {activePlan ? "Switch Plan" : "Subscribe"}
                  </Link>
                ) : (
                  <Badge>Current Plan</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                        {new Date(payment.datetime_created).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        ${(payment.amount || 0).toFixed(2)} {payment.currency || "USD"}
                      </td>
                      <td className="py-2">
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status || "pending"}
                        </Badge>
                      </td>
                      <td className="py-2 font-mono text-xs max-w-[150px] truncate">
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

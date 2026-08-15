import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { VnocTrack } from "@/components/analytics/vnoc-track";

export default async function BillingSuccessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  // Fire the purchase conversion client-side here (the only dashboard page
  // that loads analytics) so we keep the real user's source attribution.
  // Gate on a *recent* completed payment so bookmarking/re-visiting this page
  // doesn't double-count conversions.
  const memberId = parseInt(session.user.id, 10);
  const latestPayment = await prisma.member_payment.findFirst({
    where: { member_id: memberId, status: "completed" },
    orderBy: { datetime_created: "desc" },
    select: { amount: true, datetime_created: true },
  });
  const isRecentPurchase =
    !!latestPayment?.datetime_created &&
    Date.now() - new Date(latestPayment.datetime_created).getTime() <
      15 * 60 * 1000;
  const purchaseAmount =
    latestPayment?.amount != null ? String(latestPayment.amount) : undefined;

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      {isRecentPurchase && (
        <>
          <Script
            src="https://analytics.vnoc.com/tracker.js"
            data-domain="referrals.com"
            strategy="afterInteractive"
          />
          <VnocTrack name="purchase" category="revenue" value={purchaseAmount} />
        </>
      )}
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Successful
          </h1>
          <p className="mt-3 text-gray-600">
            Thank you for your purchase! Your subscription has been activated and
            you now have full access to all features included in your plan.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/billing"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-blue-600 hover:bg-gray-50"
            >
              View Billing Details
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

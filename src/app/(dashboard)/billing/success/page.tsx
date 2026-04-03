import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function BillingSuccessPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
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
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/billing"
              className="text-sm text-blue-600 hover:underline"
            >
              View Billing Details
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

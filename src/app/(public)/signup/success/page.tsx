import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Account Created",
  description:
    "Your Referrals.com account has been created. Check your email to verify.",
  openGraph: {
    title: "Account Created | Referrals.com",
    description:
      "Your Referrals.com account has been created. Check your email to verify.",
    url: "https://referrals.com/signup/success",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Account Created | Referrals.com",
    description:
      "Your Referrals.com account has been created. Check your email to verify.",
  },
};

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "your email";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Check Your Email
          </h1>
          <p className="mt-3 text-gray-600">
            We&apos;ve sent a verification link to{" "}
            <strong className="text-gray-900">{email}</strong>. Please click the
            link in the email to activate your account.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Didn&apos;t receive an email? Check your spam folder or try signing
            up again.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/signin"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

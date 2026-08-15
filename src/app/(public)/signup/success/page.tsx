import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { VnocTrack } from "@/components/analytics/vnoc-track";
import { SignupInviteCard } from "@/components/auth/signup-invite-card";
import { getSignupReferralInviteByEmail } from "@/lib/signup-referral";

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
  const invite =
    params.email && params.email.includes("@")
      ? await getSignupReferralInviteByEmail(params.email).catch(() => null)
      : null;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <VnocTrack name="signup" category="conversion" />
      <Card className="w-full max-w-md overflow-hidden border-rose-100 shadow-lg shadow-rose-100/50">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF5C62] to-[#926efb]" />
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C62]/15 to-[#926efb]/15">
            <svg
              className="h-8 w-8 text-[#FF5C62]"
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
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            You&apos;re in — check your email
          </h1>
          <p className="mt-3 text-gray-600">
            We&apos;ve sent a verification link to{" "}
            <strong className="text-gray-900">{email}</strong>. Click the link to
            activate your account and launch your first campaign.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Didn&apos;t receive an email? Check your spam folder or try signing
            up again.
          </p>
          <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-left text-sm text-gray-700">
            <p className="font-medium text-gray-900">What&apos;s next</p>
            <ol className="mt-2 space-y-1.5 text-gray-600">
              <li>1. Verify your email</li>
              <li>2. Sign in and add your website</li>
              <li>3. Launch your first campaign (14-day Growth trial starts on verify)</li>
            </ol>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/signin"
              className="inline-block rounded-xl bg-[#FF5C62] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
            >
              Go to sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm text-[#FF5C62] hover:underline"
            >
              Back to sign up
            </Link>
          </div>

          {invite ? (
            <SignupInviteCard
              shareUrl={invite.shareUrl}
              campaignId={invite.campaignId}
              participantId={invite.participantId}
            />
          ) : (
            <div className="mt-6 border-t border-rose-100 pt-5">
              <p className="text-xs text-gray-500">
                Know a business that would love this? Share Referrals.com after
                you verify — your unique invite link will be ready.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

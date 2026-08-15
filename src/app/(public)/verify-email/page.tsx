import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { TRIAL_PLAN_ID, trialExpiryFrom } from "@/lib/member-subscription";
import { SignupInviteCard } from "@/components/auth/signup-invite-card";
import { enrollMemberInSignupReferral } from "@/lib/signup-referral";

export const metadata: Metadata = {
  title: "Verify Email",
  description:
    "Verify your email address for your Referrals.com account.",
  openGraph: {
    title: "Verify Email | Referrals.com",
    description:
      "Verify your email address for your Referrals.com account.",
    url: "https://referrals.com/verify-email",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Verify Email | Referrals.com",
    description:
      "Verify your email address for your Referrals.com account.",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const email = params.email;

  let success = false;
  let errorMessage = "";
  let invite: { shareUrl: string; campaignId: number; participantId: number } | null =
    null;

  if (!code || !email) {
    errorMessage = "Invalid verification link. Missing code or email.";
  } else {
    try {
      const member = await prisma.members.findFirst({
        where: { email },
      });

      if (!member) {
        errorMessage =
          "Invalid or expired verification link. Please request a new one.";
      } else if (member.is_verified) {
        success = true; // already verified — same link is safe to reopen
        invite = await enrollMemberInSignupReferral({
          memberId: member.id,
          email: member.email,
          name: member.name,
        }).catch(() => null);
      } else if (member.verification_code !== code) {
        errorMessage =
          "Invalid or expired verification link. Please request a new one.";
      } else {
        // Start 14-day Growth trial on first verify (don't burn days before verify).
        // Skip if they already have an active paid plan.
        let paidActive = false;
        if (
          member.plan_id &&
          member.plan_id > TRIAL_PLAN_ID &&
          member.plan_expiry &&
          new Date(member.plan_expiry) > new Date()
        ) {
          const plan = await prisma.plans.findUnique({
            where: { id: member.plan_id },
            select: { price: true },
          });
          paidActive = (plan?.price ?? 0) > 0;
        }

        await prisma.members.update({
          where: { id: member.id },
          data: paidActive
            ? { is_verified: true, verification_code: null }
            : {
                is_verified: true,
                verification_code: null,
                plan_id: TRIAL_PLAN_ID,
                plan_expiry: trialExpiryFrom(),
              },
        });
        success = true;
        invite = await enrollMemberInSignupReferral({
          memberId: member.id,
          email: member.email,
          name: member.name,
        }).catch(() => null);
      }
    } catch {
      errorMessage = "Something went wrong. Please try again later.";
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {success ? (
            <>
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
                Email Verified
              </h1>
              <p className="mt-2 text-gray-600">
                Your email has been verified successfully. You can now sign in to
                your account.
              </p>
              {invite && (
                <SignupInviteCard
                  shareUrl={invite.shareUrl}
                  campaignId={invite.campaignId}
                  participantId={invite.participantId}
                />
              )}
              <Link
                href="/signin"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Verification Failed
              </h1>
              <p className="mt-2 text-gray-600">{errorMessage}</p>
              <Link
                href="/signin"
                className="mt-6 inline-block text-sm text-blue-600 hover:underline"
              >
                Go to Sign In
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Referral Program",
  description:
    "Join the Referrals.com referral program. Earn rewards by referring new users to our platform.",
};

export default function ReferralProgramPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Our Referral Program
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Love Referrals.com? Spread the word and earn rewards for every new
          user you refer.
        </p>
      </div>

      <div className="mt-12 space-y-12">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            How It Works
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Share Your Link
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to get your unique referral link from your dashboard.
                Share it with friends, colleagues, and your audience.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                2
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                They Sign Up
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                When someone signs up using your referral link, they
                automatically become your referral.
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                3
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Earn Rewards
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Earn free months of Pro access for every new user who upgrades
                to a paid plan.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            What You Earn
          </h2>
          <div className="mt-4 rounded-lg border p-6">
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <span>
                  <strong>30 days of free Pro access</strong> for every referred
                  user who creates a paid account.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <span>
                  <strong>No cap</strong> on how many referrals you can make.
                  The more you refer, the more you earn.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                <span>
                  <strong>Your referrals benefit too</strong> &mdash; they get
                  an extended trial period when they join through your link.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">
            Terms & Conditions
          </h2>
          <p className="mt-3 text-gray-600">
            Referrals must be genuine new users who have not previously had a
            Referrals.com account. Self-referrals and fraudulent activity will
            result in disqualification. We reserve the right to modify or
            discontinue the referral program at any time.
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Join Now & Start Referring
        </Link>
      </div>
    </div>
  );
}

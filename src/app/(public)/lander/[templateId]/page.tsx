import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Landing Page | Referrals.com",
  description:
    "Join our referral program and earn rewards for every friend you bring on board.",
};

function EmailForm({ buttonText = "Join Now" }: { buttonText?: string }) {
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="Enter your email"
        required
        className="flex-1 rounded-lg border border-white/10 bg-[#212529] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
      />
      <button
        type="submit"
        className="rounded-lg bg-[#FF5C62] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25"
      >
        {buttonText}
      </button>
    </form>
  );
}

function Template1() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Join Our Community
        </h1>
        <p className="mt-3 text-gray-400">
          Sign up today and start earning rewards for every referral.
        </p>
        <div className="mt-8">
          <EmailForm />
        </div>
      </div>
    </div>
  );
}

function Template2() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
        {/* Left: Image placeholder */}
        <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5C62]/20 to-[#FF5C62]/5 p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-[#FF5C62]/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-500">Campaign Image</p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Refer Friends, Earn Rewards
          </h1>
          <p className="mt-4 text-gray-400">
            Join thousands of people who are already earning rewards by sharing
            with their network. The more you share, the more you earn.
          </p>
          <div className="mt-8">
            <EmailForm buttonText="Get Started" />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

function Template3() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF5C62]/10 via-transparent to-[#212529]" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        <span className="inline-block rounded-full bg-[#FF5C62]/10 px-4 py-1.5 text-sm font-medium text-[#FF5C62]">
          Limited Time Offer
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Share & Earn with Every Referral
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-gray-400">
          Join our referral program and unlock exclusive rewards. Your network
          is your greatest asset.
        </p>
        <div className="mx-auto mt-10 max-w-md">
          <EmailForm buttonText="Claim Your Spot" />
        </div>
      </div>
    </div>
  );
}

function Template4() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Loved by Thousands
        </h1>
        <p className="mt-3 text-gray-400">
          See what our community members have to say.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <EmailForm buttonText="Join the Community" />
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            name: "Sarah K.",
            text: "I earned $500 in rewards just by sharing with my friends. Amazing program!",
          },
          {
            name: "Mike R.",
            text: "Super easy to use. The referral tracking is seamless and rewards come fast.",
          },
          {
            name: "Jessica L.",
            text: "Best referral platform I have used. Simple, clean, and rewarding.",
          },
        ].map((testimonial) => (
          <div
            key={testimonial.name}
            className="rounded-2xl border border-white/10 bg-[#292A2D] p-6"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-300">
              &ldquo;{testimonial.text}&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium text-white">
              {testimonial.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Template5() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Video placeholder */}
        <div className="relative mx-auto aspect-video max-w-lg overflow-hidden rounded-2xl bg-gradient-to-br from-[#292A2D] to-[#1a1b1e] shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF5C62] shadow-lg shadow-[#FF5C62]/30 transition-transform hover:scale-110">
              <svg
                className="ml-1 h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Watch How It Works
        </h1>
        <p className="mt-3 text-gray-400">
          Learn how our referral program can help you earn rewards by sharing
          with your network.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <EmailForm buttonText="Start Earning" />
        </div>
      </div>
    </div>
  );
}

export default async function LanderTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const id = parseInt(templateId, 10);

  switch (id) {
    case 1:
      return <Template1 />;
    case 2:
      return <Template2 />;
    case 3:
      return <Template3 />;
    case 4:
      return <Template4 />;
    case 5:
      return <Template5 />;
    default:
      return <Template1 />;
  }
}

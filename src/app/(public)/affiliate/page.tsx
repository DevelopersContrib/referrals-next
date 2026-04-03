import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Join the Referrals.com affiliate program. Earn commissions by promoting the best referral marketing platform.",
  openGraph: { title: "Affiliate Program | Referrals.com", description: "Earn commissions as a Referrals.com affiliate.", url: "https://referrals.com/affiliate" },
};

export default function AffiliatePage() {
  return (
    <div>
      {/* Breadcrumb Hero */}
      <section className="border-b border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-[#FF5C62] font-medium">Affiliate</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Join Our Affiliate Program</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-400">
            Earn generous commissions by promoting Referrals.com. Join thousands of affiliates who are earning passive income.
          </p>
        </div>
      </section>

      {/* Why Become an Affiliate */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Why Become an Affiliate?</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5C62]/10">
                <svg className="h-7 w-7 text-[#FF5C62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">High Conversion Rates</h3>
              <p className="mt-2 text-gray-400">Our platform sells itself. With a proven product and strong brand, you&apos;ll see high conversion rates from your referral links.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#926efb]/10">
                <svg className="h-7 w-7 text-[#926efb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Generous Commissions</h3>
              <p className="mt-2 text-gray-400">Earn competitive recurring commissions on every customer you refer. The more you refer, the more you earn.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5C62]/10">
                <svg className="h-7 w-7 text-[#FF5C62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Easy to Promote</h3>
              <p className="mt-2 text-gray-400">We provide marketing materials, landing pages, and tracking tools. Just share your link and we handle the rest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free affiliate account in under a minute. No approval process — start immediately." },
              { step: "2", title: "Promote", desc: "Share your unique referral link through your blog, social media, email list, or website." },
              { step: "3", title: "Earn", desc: "Earn commissions for every paying customer you refer. Track your earnings in real-time." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5C62] text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-white/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Affiliate Benefits</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8">
              <h3 className="text-lg font-semibold text-[#926efb]">Comprehensive Support</h3>
              <p className="mt-2 text-gray-400">Dedicated affiliate manager, marketing resources, and priority support to help you succeed.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8">
              <h3 className="text-lg font-semibold text-[#FF5C62]">Real-Time Tracking</h3>
              <p className="mt-2 text-gray-400">Monitor clicks, signups, and commissions in real-time through your affiliate dashboard.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#292A2D] p-8">
              <h3 className="text-lg font-semibold text-[#926efb]">Monthly Payouts</h3>
              <p className="mt-2 text-gray-400">Reliable monthly payouts via PayPal. No minimum threshold to get started.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-[#FF5C62] to-[#ff8a6c] p-12">
            <h2 className="text-3xl font-bold text-white">Refer and Earn Rewards</h2>
            <p className="mt-4 text-lg text-white/80">Start earning today. No upfront costs, no commitments.</p>
            <Link href="/signup" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#FF5C62] transition-all hover:shadow-xl">
              Join Affiliate Program
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

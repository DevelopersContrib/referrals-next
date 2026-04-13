import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Ambassador Program | Referrals.com",
  description: "Join the Referrals.com Ambassador Program and earn by promoting the world's leading referral platform.",
};

export default function AmbassadorPage() {
  return (
    <main className="min-h-screen bg-[#212529] text-white">
      {/* Hero */}
      <section className="public-hero relative overflow-x-hidden px-4 lg:overflow-visible">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#926efb]/20 to-[#FF5C62]/10" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <span className="mb-4 inline-block rounded-full border border-[#926efb]/30 bg-[#926efb]/20 px-3 py-1 text-xs font-semibold text-[#926efb] sm:mb-5 sm:px-4 sm:py-1.5 sm:text-sm">
            Ambassador Program
          </span>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:mb-5 sm:text-4xl md:text-5xl lg:text-6xl">
            Become a{" "}
            <span className="bg-gradient-to-r from-[#926efb] to-[#FF5C62] bg-clip-text text-transparent">
              Referrals.com
            </span>{" "}
            Ambassador
          </h1>
          <p className="mx-auto mb-6 max-w-3xl text-base text-gray-300 sm:mb-8 sm:text-lg md:text-xl">
            Share what you love, earn what you deserve. Join our ambassador program and get rewarded for growing our community of marketers and businesses.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#e54e54] sm:px-8 sm:py-4 sm:text-lg"
            >
              Apply Now — It&apos;s Free
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-gray-600 px-6 py-3 text-base font-semibold text-gray-300 transition-colors hover:border-gray-400 hover:text-white sm:px-8 sm:py-4 sm:text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#2d2f33] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "30%", label: "Recurring Commission" },
            { value: "90 Days", label: "Cookie Duration" },
            { value: "10,000+", label: "Active Ambassadors" },
            { value: "$500K+", label: "Paid Out" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-[#926efb] mb-2">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to start earning</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Apply & Get Approved",
                desc: "Sign up for the ambassador program. We review all applications within 48 hours and accept creators, marketers, and business owners.",
              },
              {
                step: "02",
                title: "Share Your Unique Link",
                desc: "Get your personalized referral link, promotional materials, and access to our ambassador dashboard to track your performance.",
              },
              {
                step: "03",
                title: "Earn Recurring Commissions",
                desc: "Earn 30% recurring commission on every paying customer you refer — for as long as they remain a customer.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-[#292A2D] rounded-2xl p-8 border border-[#3a3b3e]">
                <div className="text-5xl font-bold text-[#926efb]/30 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-[#1a1b1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Ambassador Benefits</h2>
            <p className="text-gray-400 text-lg">Everything you need to succeed</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💰", title: "30% Recurring Commission", desc: "Earn month after month on every referral that stays subscribed." },
              { icon: "📊", title: "Real-time Dashboard", desc: "Track clicks, signups, and earnings in your personal ambassador portal." },
              { icon: "🎨", title: "Marketing Assets", desc: "Access banners, email templates, social media graphics, and more." },
              { icon: "🤝", title: "Dedicated Support", desc: "Get a dedicated ambassador manager to help you maximize earnings." },
              { icon: "🏆", title: "Exclusive Rewards", desc: "Top ambassadors unlock bonuses, swag, and exclusive partnership opportunities." },
              { icon: "🌍", title: "Global Program", desc: "Earn in USD regardless of where you or your audience are located." },
            ].map((benefit) => (
              <div key={benefit.title} className="bg-[#292A2D] rounded-xl p-6 border border-[#3a3b3e]">
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Ambassador Tiers</h2>
            <p className="text-gray-400 text-lg">Grow your earnings as you grow with us</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tier: "Starter", commission: "20%", referrals: "1–10", color: "from-gray-600 to-gray-700" },
              { tier: "Pro", commission: "25%", referrals: "11–50", color: "from-[#5867dd] to-[#926efb]" },
              { tier: "Elite", commission: "30%", referrals: "51+", color: "from-[#FF5C62] to-[#926efb]" },
            ].map((tier) => (
              <div key={tier.tier} className={`bg-gradient-to-br ${tier.color} rounded-2xl p-8 text-center`}>
                <div className="text-sm font-semibold uppercase tracking-widest mb-2 opacity-80">{tier.tier}</div>
                <div className="text-5xl font-bold mb-1">{tier.commission}</div>
                <div className="text-sm opacity-80 mb-4">recurring commission</div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
                  {tier.referrals} active referrals
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-[#1a1b1e]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: "Who can become an ambassador?", a: "Anyone! We welcome bloggers, YouTubers, marketers, consultants, and business owners. If you have an audience interested in marketing or growth, you're a great fit." },
              { q: "When do I get paid?", a: "Commissions are paid monthly via PayPal or bank transfer. Minimum payout threshold is $50." },
              { q: "How long does the cookie last?", a: "Our referral cookie lasts 90 days, meaning you earn commission if someone signs up within 90 days of clicking your link." },
              { q: "Can I promote multiple products?", a: "Yes! You can promote all Referrals.com plans including our whitelabel offering, which carries higher commissions." },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#292A2D] rounded-xl p-6 border border-[#3a3b3e]">
                <h3 className="font-semibold text-lg mb-3">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of ambassadors already earning with Referrals.com
          </p>
          <Link
            href="/signup"
            className="bg-[#FF5C62] hover:bg-[#e54e54] text-white font-semibold px-10 py-4 rounded-lg transition-colors text-lg inline-block"
          >
            Apply Now — Free to Join
          </Link>
        </div>
      </section>
    </main>
  );
}

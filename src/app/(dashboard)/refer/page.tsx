import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CoinsIcon,
  GiftIcon,
  MailIcon,
  NetworkIcon,
  Share2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrollMemberInSignupReferral } from "@/lib/signup-referral";
import { normalizeDomain } from "@/lib/domain-brand";
import { NETWORK_EMAIL_DOMAIN } from "@/lib/domain-referrer";
import { CopyLinkBox } from "@/components/refer/copy-link-box";
import { NetworkLinkBuilder } from "@/components/refer/network-link-builder";

export const metadata: Metadata = {
  title: "Refer & Earn",
  robots: { index: false, follow: false },
};

/**
 * Refer & Earn: every member is enrolled in the Referrals.com referral program
 * at sign-up. This page puts their personal link, what it has earned, and the
 * "refer another site" network links in one place.
 */
export default async function ReferAndEarnPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/signin?callbackUrl=/refer");
  const memberId = parseInt(session.user.id, 10);

  const invite = await enrollMemberInSignupReferral({
    memberId,
    email: session.user.email,
    name: session.user.name,
  }).catch(() => null);

  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "asc" },
    select: { id: true, domain: true },
  });
  const brandDomains = brands
    .map((b) => normalizeDomain(b.domain || ""))
    .filter(Boolean);

  // Personal link results
  const [joined, signupRewards] = invite
    ? await Promise.all([
        prisma.campaign_participants.count({ where: { invited_by: invite.participantId } }),
        prisma.participants_rewards.count({ where: { participant_id: invite.participantId } }),
      ])
    : [0, 0];

  // Network ("refer another site") results, per brand
  const networkReferrers = brandDomains.length
    ? await prisma.campaign_participants.findMany({
        where: { email: { in: brandDomains.map((d) => `${d}@${NETWORK_EMAIL_DOMAIN}`) } },
        select: { id: true, email: true },
      })
    : [];
  const referrerIds = networkReferrers.map((r) => r.id);
  const [leadsByReferrer, tokensByReferrer] = referrerIds.length
    ? await Promise.all([
        prisma.campaign_participants.groupBy({
          by: ["invited_by"],
          where: { invited_by: { in: referrerIds } },
          _count: { _all: true },
        }),
        prisma.participants_rewards.groupBy({
          by: ["participant_id"],
          where: { participant_id: { in: referrerIds } },
          _sum: { token_amount: true },
        }),
      ])
    : [[], []];
  const networkRows = brandDomains.map((domain) => {
    const ids = networkReferrers
      .filter((r) => r.email === `${domain}@${NETWORK_EMAIL_DOMAIN}`)
      .map((r) => r.id);
    const leads = leadsByReferrer
      .filter((g) => g.invited_by != null && ids.includes(g.invited_by))
      .reduce((n, g) => n + g._count._all, 0);
    const tokens = tokensByReferrer
      .filter((g) => ids.includes(g.participant_id))
      .reduce((n, g) => n + (g._sum.token_amount ?? 0), 0);
    return { domain, leads, tokens };
  });
  const totalNetworkLeads = networkRows.reduce((n, r) => n + r.leads, 0);

  const shareUrl = invite?.shareUrl ?? "";
  const shareText = "I use Referrals.com to run my referral program. Set yours up free:";
  const enc = encodeURIComponent;
  const shares = shareUrl
    ? [
        { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(shareUrl)}` },
        { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
        { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}` },
        { label: "Email", href: `mailto:?subject=${enc("Try Referrals.com")}&body=${enc(`${shareText} ${shareUrl}`)}` },
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero: your link */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff5c62] via-[#e0464c] to-[#7c3aed] p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Refer &amp; Earn</p>
        <h1
          className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          Share Referrals.com, earn rewards
        </h1>
        <p className="mt-2 max-w-2xl text-base text-white/90">
          You&apos;re already in our referral program. Every business that signs up with your link
          earns you a reward.
        </p>

        <div className="mt-6 max-w-2xl">
          {shareUrl ? (
            <CopyLinkBox url={shareUrl} />
          ) : (
            <p className="rounded-xl bg-white/15 p-3 text-sm">
              We couldn&apos;t load your link right now. Refresh the page to try again.
            </p>
          )}
        </div>

        {shares.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-white/80">
              <Share2Icon className="size-4" aria-hidden="true" /> Share on
            </span>
            {shares.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-sm font-medium text-white transition hover:bg-white/25"
              >
                {s.label === "Email" && <MailIcon className="size-3.5" aria-hidden="true" />}
                {s.label}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Your results */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<UserPlusIcon className="size-5" />} tone="rose" label="Signed up with your link" value={joined} />
        <Stat icon={<GiftIcon className="size-5" />} tone="violet" label="Rewards earned" value={signupRewards} />
        <Stat icon={<UsersIcon className="size-5" />} tone="emerald" label="Leads sent to network sites" value={totalNetworkLeads} />
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Share your link", "Send it to business owners, post it, or add it to your newsletter."],
            ["They sign up", "When a business creates an account through your link, it's tracked to you."],
            ["You earn", "Your reward is credited in ADAO tokens and shows up above."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5c62] to-[#7c3aed] text-sm font-bold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-gray-900">{title}</span>
                <span className="block text-sm text-gray-600">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Refer another site */}
      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <NetworkIcon className="size-5 text-[#7c3aed]" aria-hidden="true" />
              Refer another site, earn $5 per lead
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Link from your brand to another site in our network. When a visitor you send there
              signs up, your brand earns $5 in tokens. Rewards are recorded now and minted to your
              wallet later (the domain&apos;s token if it has one, otherwise ADAO).
            </p>
          </div>
        </div>

        <div className="mt-5">
          <NetworkLinkBuilder brands={brandDomains} />
        </div>

        {networkRows.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Your brand</th>
                  <th className="py-2 font-medium">Leads sent</th>
                  <th className="py-2 font-medium">Tokens earned</th>
                </tr>
              </thead>
              <tbody>
                {networkRows.map((r) => (
                  <tr key={r.domain} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{r.domain}</td>
                    <td className="py-2">{r.leads.toLocaleString()}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1">
                        <CoinsIcon className="size-3.5 text-amber-500" aria-hidden="true" />
                        {r.tokens.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: "rose" | "violet" | "emerald";
  label: string;
  value: number;
}) {
  const toneCls = {
    rose: "bg-rose-50 text-[#d63a40]",
    violet: "bg-violet-50 text-[#7c3aed]",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <span className={`flex size-10 items-center justify-center rounded-xl ${toneCls}`} aria-hidden="true">
        {icon}
      </span>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

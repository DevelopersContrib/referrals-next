import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type TemplateDetail = {
  slug: string;
  title: string;
  tag: "Free" | "Premium";
  summary: string;
  details: string;
  steps: string[];
};

const templates: TemplateDetail[] = [
  {
    slug: "social-instant",
    title: "Social Instant Reward",
    tag: "Free",
    summary:
      "Reward participants the moment they share on social. Built for fast viral loops and launch-week buzz.",
    details:
      "Social Instant Reward is for launches that need shares immediately. A visitor joins, posts or sends their link, and the reward unlocks as soon as the share is tracked. Use it when the goal is reach in the first few days, not a long nurture sequence.",
    steps: [
      "Set the reward that unlocks after a tracked share.",
      "Place the widget on your launch page or post-purchase screen.",
      "Watch shares and clicks from the campaign dashboard.",
    ],
  },
  {
    slug: "token-reward",
    title: "Token Reward",
    tag: "Premium",
    summary:
      "Crypto-native incentives for Web3 communities — referrals that feel on-chain without the friction.",
    details:
      "Token Reward is for communities that already think in tokens. Participants earn a token-denominated reward when their referrals hit the goal you set. The campaign page explains the reward in plain language so people do not need a wallet tutorial to join.",
    steps: [
      "Name the token reward and the referral goal.",
      "Publish the campaign to your community channels.",
      "Confirm rewards from the participant list as goals are met.",
    ],
  },
  {
    slug: "download-giveaway",
    title: "Download Giveaway",
    tag: "Free",
    summary:
      "Ebooks, guides, or assets in exchange for qualified referrals. Perfect for lead-gen and content marketing.",
    details:
      "Download Giveaway trades a useful file for a qualified referral. The participant shares their link, and the download unlocks when the goal is reached. It fits content marketers who already have an ebook, checklist, or template worth passing along.",
    steps: [
      "Attach the asset people will unlock.",
      "Set how many referrals are required.",
      "Embed the campaign where readers already look for the download.",
    ],
  },
  {
    slug: "photo-voting",
    title: "Photo Voting",
    tag: "Premium",
    summary:
      "UGC contests where friends vote. High engagement and shareable moments across social.",
    details:
      "Photo Voting turns a contest into a referral loop. Each entry asks friends to vote, and every vote is a chance to bring a new person to the campaign. Use it for seasonal contests, customer stories, or community showcases.",
    steps: [
      "Define the contest theme and voting window.",
      "Let participants submit an entry and share a vote link.",
      "Rank entries from the votes recorded on the campaign.",
    ],
  },
  {
    slug: "poll-campaign",
    title: "Poll Campaign",
    tag: "Free",
    summary:
      "Collect opinions and grow your list at the same time — every vote can carry a referral ask.",
    details:
      "Poll Campaign collects an answer and asks the voter to share the poll. It works when you want both feedback and new signups, such as a product vote, a flavor test, or a feature priority survey.",
    steps: [
      "Write a short poll with a clear question.",
      "Add a referral goal to the thank-you step.",
      "Share the poll on the pages where your audience already decides.",
    ],
  },
  {
    slug: "closed-beta",
    title: "Closed Beta",
    tag: "Premium",
    summary:
      "Invite-only access with referral gates. Ideal for product-led growth before a public launch.",
    details:
      "Closed Beta keeps the product invite-only while still letting early users bring the next cohort. Access expands when someone hits the referral goal, so the waitlist grows through people who already care about the product.",
    steps: [
      "Set how many invites unlock the next spot.",
      "Share the campaign with your current waitlist.",
      "Approve or reward participants as they qualify.",
    ],
  },
  {
    slug: "info-bar",
    title: "Info Bar",
    tag: "Free",
    summary:
      "A slim top bar that follows visitors site-wide — always-on promotion without blocking content.",
    details:
      "Info Bar is a thin announcement strip that stays visible as people browse. It points to the referral campaign without taking over the page, which makes it a fit for stores and blogs that already have a primary layout.",
    steps: [
      "Write a one-line offer for the bar.",
      "Link it to the full campaign page.",
      "Add the bar snippet to your site template.",
    ],
  },
  {
    slug: "full-page",
    title: "Full Page Takeover",
    tag: "Premium",
    summary:
      "Maximum-impact landing for launches. One focused story: join, refer, unlock.",
    details:
      "Full Page Takeover is a dedicated landing page with a single action. Use it for a launch, a seasonal push, or a partner promotion when you want the referral story to be the whole page, not a widget in the corner.",
    steps: [
      "Write the headline, reward, and join button.",
      "Publish the page on its own URL.",
      "Send launch traffic straight to that page.",
    ],
  },
];

export function generateStaticParams() {
  return templates.map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = templates.find((item) => item.slug === slug);
  if (!template) return { title: "Campaign Template" };
  return {
    title: `${template.title} Template`,
    description: template.summary,
    alternates: {
      canonical: `https://www.referrals.com/campaign-templates/${template.slug}`,
    },
    openGraph: {
      title: `${template.title} Template | Referrals.com`,
      description: template.summary,
      url: `https://www.referrals.com/campaign-templates/${template.slug}`,
    },
  };
}

export default async function CampaignTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = templates.find((item) => item.slug === slug);
  if (!template) notFound();

  return (
    <div className="min-h-screen bg-[#16171a]">
      <section className="public-hero border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/campaign-templates"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            All templates
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#FF5C62]">
            {template.tag} template
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{template.title}</h1>
          <p className="mt-4 text-base text-gray-300">{template.summary}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm leading-relaxed text-gray-300 sm:text-base">{template.details}</p>
          <ol className="mt-8 space-y-3">
            {template.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-gray-200">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FF5C62] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href={`/signup?ref=templates&tpl=${encodeURIComponent(template.slug)}`}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#FF5C62] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff4f58]"
          >
            Use this template
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

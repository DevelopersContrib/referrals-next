/**
 * Adds current forum threads from one existing member. Safe to re-run:
 * categories and topics are skipped when the slug already exists.
 *
 *   npx tsx scripts/seed-forum-2026.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHOR_EMAIL = "maidabarrientos@gmail.com";

const categories = [
  { name: "Getting started", slug: "getting-started" },
  { name: "Campaigns", slug: "campaigns" },
] as const;

type SeedPost = {
  slug: string;
  title: string;
  categorySlug: string;
  date: string;
  content: string;
  reply?: { date: string; answer: string };
};

const posts: SeedPost[] = [
  {
    slug: "how-publishing-a-brand-works",
    title: "How publishing a brand works",
    categorySlug: "getting-started",
    date: "2026-10-16T16:00:00.000Z",
    content: `You can set up a brand before you pay. It stays private, and the widget will not take signups yet.

When you are ready for it to go live, publish that brand at $9/mo. After payment the campaign can be public and the widget can accept signups. Each extra brand is another $9/mo. Cancel anytime and that brand goes back to private.

I set the first brand up, checked the campaign while it was still private, then paid when I actually wanted people to join.`,
    reply: {
      date: "2026-10-16T20:00:00.000Z",
      answer:
        "The $9 is per brand, not per campaign. One published brand can have more than one campaign.",
    },
  },
  {
    slug: "campaign-stays-private-until-you-pay",
    title: "A new campaign stays private until the brand is paid",
    categorySlug: "campaigns",
    date: "2026-10-12T16:00:00.000Z",
    content: `Creating a campaign no longer sends you off to checkout. You get a “Campaign created” message and land on the campaign page.

If the brand is not paid yet, the new campaign is saved as private. You can still edit the reward, the share link, and the page. It just is not open for public signups until you publish the brand.`,
  },
  {
    slug: "where-to-copy-the-referral-link",
    title: "Where to copy the referral link",
    categorySlug: "getting-started",
    date: "2026-10-08T16:00:00.000Z",
    content: `On the campaign page, use Copy referral link. That copies the share URL for that campaign.

If the button does nothing, the page has to be on https (or localhost). Browsers block clipboard access on a plain http page that is not a secure context.

Share that link only after the brand is published. Before that, people who open the widget cannot sign up.`,
  },
  {
    slug: "widget-signups-wait-until-publish",
    title: "Widget signups wait until the brand is published",
    categorySlug: "getting-started",
    date: "2026-10-02T16:00:00.000Z",
    content: `I embedded the widget, sent it to a friend, and the signup was refused. That was expected: the brand was still private.

Publishing at $9/mo is what opens the widget. Until then the campaign page can exist, but new participants cannot join through it.

Worth checking the brand’s billing status before you send the link out.`,
    reply: {
      date: "2026-10-03T15:00:00.000Z",
      answer:
        "Private is the right state while you are still editing the reward. Publish when the offer is something you would actually hand to a customer.",
    },
  },
  {
    slug: "what-reward-are-you-using-for-saas",
    title: "What reward are you using for a SaaS referral?",
    categorySlug: "campaigns",
    date: "2026-09-22T16:00:00.000Z",
    content: `I am setting a signup goal, not a visit goal. A visit is too easy to inflate, and the reward should fire when someone actually creates an account.

Curious what others are offering: account credit, a free month, or cash after the referred person stays. For a $9/mo tool, a free month for both sides feels clearer than a small cash payout.

How many signups are you requiring before the reward is earned?`,
  },
  {
    slug: "double-sided-or-single-reward",
    title: "Double-sided reward, or only thank the referrer?",
    categorySlug: "campaigns",
    date: "2026-09-08T16:00:00.000Z",
    content: `A double-sided offer (the referrer and the new customer both get something) has been easier to explain than a referrer-only bonus. The new person has a reason to finish signup, not just click.

A single-sided thank-you is simpler to operate if the reward is manual. I would only do that if the payout is something you can fulfill without arguing about who qualified.

If you have run both, which one actually got shared?`,
  },
  {
    slug: "browse-programs-by-industry",
    title: "Suggestion: browse public programs by industry",
    categorySlug: "feature-suggestions",
    date: "2026-08-20T16:00:00.000Z",
    content: `The public brand pages are useful once you already know the company. They are harder to browse when you want “tools for agencies” or “local services.”

A simple industry filter on the programs people have published would help. Not a marketplace with bidding. Just a way to see live referral programs in one category.

Would you use that, or is search by name enough?`,
  },
  {
    slug: "api-access-is-limited-to-your-campaigns",
    title: "API access only returns your own campaigns",
    categorySlug: "community-governance",
    date: "2026-08-06T16:00:00.000Z",
    content: `If you connect Zapier or call the API, the key only sees campaigns on your account. Asking for someone else’s campaign id comes back as not found. A missing or bad key is rejected before any data is returned.

Bad ids and bad JSON should get a normal client error, not a server error. If a call fails, check the key first, then the id.

Use this for your own participants and campaigns. It is not a way to read another member’s list.`,
  },
];

async function main() {
  const author = await prisma.members.findFirst({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, name: true },
  });
  if (!author) {
    throw new Error("Author account was not found. No topics were created.");
  }

  const categoryIds = new Map<string, number>();
  for (const category of categories) {
    const existing = await prisma.topic_categories.findFirst({
      where: { slug: category.slug },
      select: { id: true },
    });
    const row =
      existing ??
      (await prisma.topic_categories.create({
        data: { name: category.name, slug: category.slug },
        select: { id: true },
      }));
    categoryIds.set(category.slug, row.id);
  }

  const existingFeature = await prisma.topic_categories.findFirst({
    where: { slug: "feature-suggestions" },
    select: { id: true },
  });
  const existingCommunity = await prisma.topic_categories.findFirst({
    where: { slug: "community-governance" },
    select: { id: true },
  });
  if (existingFeature) categoryIds.set("feature-suggestions", existingFeature.id);
  if (existingCommunity) {
    categoryIds.set("community-governance", existingCommunity.id);
  }

  let created = 0;
  let skipped = 0;
  for (const post of posts) {
    const categoryId = categoryIds.get(post.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category ${post.categorySlug}`);
    }

    const already = await prisma.topics.findFirst({
      where: { slug: post.slug },
      select: { id: true },
    });
    if (already) {
      skipped += 1;
      console.log(`skip  ${post.slug}`);
      continue;
    }

    const topic = await prisma.topics.create({
      data: {
        title: post.title,
        content: post.content,
        slug: post.slug,
        member_id: author.id,
        category_id: categoryId,
        date_posted: new Date(post.date),
      },
      select: { id: true, slug: true },
    });
    created += 1;
    console.log(`topic #${topic.id}  ${topic.slug}`);

    if (post.reply) {
      await prisma.topic_comments.create({
        data: {
          topic_id: topic.id,
          member_id: author.id,
          answer: post.reply.answer,
          date_posted: new Date(post.reply.date),
        },
      });
    }
  }

  console.log(
    `author #${author.id} ${author.name}  created ${created}  skipped ${skipped}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

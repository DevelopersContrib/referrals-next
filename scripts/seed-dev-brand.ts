/**
 * Local-only fixture: one brand with a 1-signup and a 2-signup campaign, so the
 * public brand/campaign pages have something to render. Safe to re-run.
 *
 *   npx tsx scripts/seed-dev-brand.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const member =
    (await prisma.members.findFirst({ where: { email: "dev@example.com" } })) ??
    (await prisma.members.create({
      data: {
        email: "dev@example.com",
        name: "Dev Owner",
        is_verified: true,
      },
    }));

  const brand =
    (await prisma.member_urls.findFirst({ where: { slug: "giftcast" } })) ??
    (await prisma.member_urls.create({
      data: {
        url: "https://giftcast.com",
        domain: "giftcast.com",
        slug: "giftcast",
        description: "Send gift cards that actually get used.",
        member_id: member.id,
      },
    }));

  const existing = await prisma.member_campaigns.count({
    where: { url_id: brand.id },
  });

  if (existing === 0) {
    await prisma.member_campaigns.createMany({
      data: [
        {
          name: "Refer a Friend",
          type_id: 1,
          reward_type: 1,
          url_id: brand.id,
          member_id: member.id,
          goal_type: "signup",
          num_signups: 1,
          publish: "public",
        },
        {
          name: "Holiday Giveaway",
          type_id: 1,
          reward_type: 1,
          url_id: brand.id,
          member_id: member.id,
          goal_type: "signup",
          num_signups: 5,
          publish: "public",
        },
        {
          name: "Traffic Push",
          type_id: 1,
          reward_type: 1,
          url_id: brand.id,
          member_id: member.id,
          goal_type: "visit",
          num_visits: 1,
          publish: "public",
        },
      ],
    });
  }

  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brand.id },
    select: { id: true, name: true, num_signups: true, num_visits: true },
  });

  console.log(`member  #${member.id}  ${member.email}`);
  console.log(`brand   #${brand.id}  ${brand.domain}  -> /p/${brand.slug}`);
  for (const c of campaigns) {
    console.log(
      `campaign #${c.id}  ${c.name}  -> /p/${brand.slug}/campaign/${c.id}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

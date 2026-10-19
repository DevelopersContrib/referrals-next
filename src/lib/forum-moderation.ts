import { prisma } from "@/lib/prisma";

const LINK_RE = /https?:\/\/[^\s]+/gi;
export const MAX_LINKS_PER_POST = 2;
export const MAX_POSTS_PER_HOUR = 5;

export function countLinks(text: string): number {
  return (text.match(LINK_RE) || []).length;
}

export function assertPostLimits(text: string): string | null {
  if (countLinks(text) > MAX_LINKS_PER_POST) {
    return `Posts can include at most ${MAX_LINKS_PER_POST} links.`;
  }
  return null;
}

export async function postsInLastHour(memberId: number): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [topics, comments] = await Promise.all([
    prisma.topics.count({
      where: { member_id: memberId, date_posted: { gte: since } },
    }),
    prisma.topic_comments.count({
      where: { member_id: memberId, date_posted: { gte: since } },
    }),
  ]);
  return topics + comments;
}

export async function assertRateLimit(memberId: number): Promise<string | null> {
  const count = await postsInLastHour(memberId);
  if (count >= MAX_POSTS_PER_HOUR) {
    return "You can post at most 5 times per hour.";
  }
  return null;
}

export async function isFirstForumPost(memberId: number): Promise<boolean> {
  const [topics, comments] = await Promise.all([
    prisma.topics.count({ where: { member_id: memberId } }),
    prisma.topic_comments.count({ where: { member_id: memberId } }),
  ]);
  return topics + comments === 0;
}

export async function shouldHoldForReview(memberId: number): Promise<boolean> {
  const member = await prisma.members.findUnique({
    where: { id: memberId },
    select: { is_team: true, is_admin: true },
  });
  if (member?.is_team || member?.is_admin) return false;
  return isFirstForumPost(memberId);
}

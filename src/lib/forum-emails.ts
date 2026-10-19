import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/ses";
import { siteUrl } from "@/lib/site-url";
import { PUBLIC_TOPIC_STATUSES } from "@/lib/forum-constants";

function wrap(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${title}</h2>
      ${body}
      <p style="color:#666;font-size:12px;">You received this because of your Referrals.com forum settings.</p>
    </div>
  `;
}

export async function notifyTopicReply(options: {
  topicId: number;
  commentId: number;
  replierId: number;
}) {
  const topic = await prisma.topics.findUnique({
    where: { id: options.topicId },
  });
  if (!topic || (topic.status !== "open" && topic.status !== "answered")) {
    return { sent: 0 };
  }

  const comment = await prisma.topic_comments.findUnique({
    where: { id: options.commentId },
  });
  if (!comment || comment.status !== "open") return { sent: 0 };

  const followers = await prisma.topic_followers.findMany({
    where: { topic_id: options.topicId },
    select: { member_id: true },
  });

  const recipientIds = new Set<number>();
  if (topic.member_id && topic.member_id !== options.replierId) {
    recipientIds.add(topic.member_id);
  }
  for (const follower of followers) {
    if (follower.member_id !== options.replierId) {
      recipientIds.add(follower.member_id);
    }
  }
  if (recipientIds.size === 0) return { sent: 0 };

  const members = await prisma.members.findMany({
    where: { id: { in: [...recipientIds] } },
    select: { id: true, email: true, name: true },
  });

  const url = siteUrl(`/forum/post/${topic.slug || topic.id}`);
  const preview = (comment.answer || "").replace(/\s+/g, " ").trim().slice(0, 180);
  let sent = 0;

  for (const member of members) {
    if (!member.email) continue;
    await sendEmail({
      to: member.email,
      fromName: "Referrals.com Forum",
      subject: `New reply: ${topic.title}`,
      html: wrap(
        "New reply on a topic you follow",
        `<p>Hi ${member.name.split(" ")[0] || "there"},</p>
         <p><strong>${topic.title}</strong> has a new reply:</p>
         <p>${preview}</p>
         <p><a href="${url}">Read the thread</a></p>`,
      ),
    });
    sent += 1;
  }

  return { sent };
}

export async function sendWeeklyForumDigest(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const members = await prisma.members.findMany({
    where: { forum_digest: true },
    select: { id: true, email: true, name: true },
  });

  const [topics, comments] = await Promise.all([
    prisma.topics.findMany({
      where: {
        date_posted: { gte: since },
        status: { in: [...PUBLIC_TOPIC_STATUSES] },
      },
      orderBy: { date_posted: "desc" },
      take: 20,
      select: { id: true, title: true, slug: true },
    }),
    prisma.topic_comments.findMany({
      where: {
        date_posted: { gte: since },
        status: "open",
      },
      orderBy: { date_posted: "desc" },
      take: 20,
      select: { id: true, topic_id: true, answer: true },
    }),
  ]);

  if (topics.length === 0 && comments.length === 0) {
    return { dryRun, members: members.length, sent: 0, skipped: members.length };
  }

  const commentTopicIds = [
    ...new Set(
      comments.map((c) => c.topic_id).filter((id): id is number => id != null),
    ),
  ];
  const commentTopics =
    commentTopicIds.length > 0
      ? await prisma.topics.findMany({
          where: {
            id: { in: commentTopicIds },
            status: { in: [...PUBLIC_TOPIC_STATUSES] },
          },
          select: { id: true, title: true, slug: true },
        })
      : [];
  const topicMap = new Map(commentTopics.map((t) => [t.id, t]));

  const topicList = topics
    .map(
      (t) =>
        `<li><a href="${siteUrl(`/forum/post/${t.slug || t.id}`)}">${t.title}</a></li>`,
    )
    .join("");
  const answerList = comments
    .map((c) => {
      const topic = c.topic_id ? topicMap.get(c.topic_id) : null;
      if (!topic) return "";
      return `<li>Reply on <a href="${siteUrl(`/forum/post/${topic.slug || topic.id}`)}">${topic.title}</a></li>`;
    })
    .filter(Boolean)
    .join("");

  let sent = 0;
  for (const member of members) {
    if (!member.email) continue;
    if (dryRun) {
      sent += 1;
      continue;
    }
    await sendEmail({
      to: member.email,
      fromName: "Referrals.com Forum",
      subject: "This week in the Referrals.com forum",
      html: wrap(
        "Weekly forum digest",
        `<p>Hi ${member.name.split(" ")[0] || "there"},</p>
         <p>New topics and answers from the past 7 days:</p>
         ${topicList ? `<h3>New topics</h3><ul>${topicList}</ul>` : ""}
         ${answerList ? `<h3>New answers</h3><ul>${answerList}</ul>` : ""}
         <p><a href="${siteUrl("/forum")}">Visit the forum</a></p>`,
      ),
    });
    sent += 1;
  }

  return { dryRun, members: members.length, sent, skipped: 0 };
}

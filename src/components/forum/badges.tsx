import { Badge } from "@/components/ui/badge";

/**
 * Marks a reply or topic as written by Referrals.com staff, so readers can tell
 * an official answer from a community one at a glance.
 */
export function TeamBadge() {
  return <Badge className="bg-[#7C3AED] text-xs text-white">TEAM</Badge>;
}

/**
 * Shown on topics with no replies yet. Matches the "unanswered" tab, which
 * counts a topic as answered once it has at least one visible reply.
 */
export function NeedsAnswerBadge() {
  return (
    <Badge className="bg-amber-100 text-xs text-amber-900">
      Needs an answer
    </Badge>
  );
}

/**
 * A topic is waiting on the community while it has no visible replies, matching
 * how the "unanswered" tab counts them.
 *
 * Pinned topics and announcements are excluded — they are notices rather than
 * questions, so prompting for an answer on them reads as a neglected forum.
 */
export function needsAnswer(topic: {
  status: string;
  replyCount: number;
  is_pinned: boolean;
  isAnnouncement?: boolean;
}) {
  if (topic.is_pinned || topic.isAnnouncement) return false;
  return topic.status !== "answered" && topic.replyCount === 0;
}

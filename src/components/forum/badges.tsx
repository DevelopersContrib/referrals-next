import { Badge } from "@/components/ui/badge";

/**
 * Marks a reply or topic as written by Referrals.com staff, so readers can tell
 * an official answer from a community one at a glance.
 */
export function TeamBadge() {
  return <Badge className="bg-[#7C3AED] text-xs text-white">TEAM</Badge>;
}

/**
 * Shown on questions the community has left sitting. Deliberately narrower
 * than the "unanswered" tab, which lists a topic the moment it has no reply.
 */
export function NeedsAnswerBadge() {
  return (
    <Badge className="bg-amber-100 text-xs text-amber-900">
      Needs an answer
    </Badge>
  );
}

/** A question gets a day to be answered before the forum calls it neglected. */
const NEEDS_ANSWER_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * A topic is waiting on the community once it has gone a day with no visible
 * reply. The delay matters: without it every question is branded unanswered
 * the second it is posted, which reads worse than saying nothing at all.
 *
 * Pinned topics and announcements are excluded — they are notices rather than
 * questions, so prompting for an answer on them reads as a neglected forum.
 *
 * Pass `now` to keep every row on a page judged against the same instant.
 */
export function needsAnswer(topic: {
  status: string;
  replyCount: number;
  is_pinned: boolean;
  date_posted: Date | string;
  isAnnouncement?: boolean;
  now?: number;
}) {
  if (topic.is_pinned || topic.isAnnouncement) return false;
  if (topic.status === "answered" || topic.replyCount > 0) return false;
  const posted = new Date(topic.date_posted).getTime();
  if (!Number.isFinite(posted)) return false;
  return (topic.now ?? Date.now()) - posted >= NEEDS_ANSWER_AFTER_MS;
}

-- JJ1 — Additive forum schema (pinned, status, activity, followers).
-- Shared MySQL: additive only. Run on prod BEFORE deploying the Prisma change
-- so topics/members queries do not hit P2022 (unknown column).
-- Safe to skip a statement if that column/table already exists.

-- topics: list order, moderation, accepted answer, view tiebreak
ALTER TABLE topics
  ADD COLUMN is_pinned TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'open',
  ADD COLUMN last_activity_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN accepted_comment_id INT NULL,
  ADD COLUMN view_count INT NOT NULL DEFAULT 0;

ALTER TABLE topics
  ADD INDEX idx_topics_pinned_activity (is_pinned, last_activity_at),
  ADD INDEX idx_topics_status (status);

-- Backfill last activity from latest comment, else date_posted
UPDATE topics t
LEFT JOIN (
  SELECT topic_id, MAX(date_posted) AS last_comment
  FROM topic_comments
  GROUP BY topic_id
) c ON c.topic_id = t.id
SET t.last_activity_at = COALESCE(c.last_comment, t.date_posted);

-- Backfill view_count from topic_views
UPDATE topics t
LEFT JOIN (
  SELECT topic_id, COUNT(*) AS views
  FROM topic_views
  GROUP BY topic_id
) v ON v.topic_id = t.id
SET t.view_count = COALESCE(v.views, 0);

-- topic_categories: sidebar copy, sort, Archive
ALTER TABLE topic_categories
  ADD COLUMN description VARCHAR(255) NULL,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
  ADD COLUMN is_archived TINYINT NOT NULL DEFAULT 0;

-- members: Team badge + weekly digest opt-in
ALTER TABLE members
  ADD COLUMN is_team TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN forum_digest TINYINT NOT NULL DEFAULT 0;

UPDATE members
SET is_team = 1
WHERE email = 'maidabarrientos@gmail.com';

-- Following tab + reply emails
CREATE TABLE IF NOT EXISTS topic_followers (
  id         INT NOT NULL AUTO_INCREMENT,
  topic_id   INT NOT NULL,
  member_id  INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_topic_follower (topic_id, member_id),
  INDEX idx_topic_followers_member (member_id),
  INDEX idx_topic_followers_topic (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

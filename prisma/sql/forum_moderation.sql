-- JJ5 — Forum moderation queue + comment status for first-post review.
-- Additive only. Run after forum_redesign_schema.sql.

ALTER TABLE topic_comments
  ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'open';

ALTER TABLE topic_comments
  ADD INDEX idx_topic_comments_status (status);

CREATE TABLE IF NOT EXISTS topic_reports (
  id          INT NOT NULL AUTO_INCREMENT,
  topic_id    INT NULL,
  comment_id  INT NULL,
  reported_by INT NOT NULL,
  reason      VARCHAR(255) NULL,
  status      VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_topic_reports_status (status),
  INDEX idx_topic_reports_topic (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

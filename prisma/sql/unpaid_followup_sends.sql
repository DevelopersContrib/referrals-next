-- B8: Follow-up email series for unpaid brand owners.
-- Additive only — do NOT run until Lee and Maida approve.

CREATE TABLE IF NOT EXISTS `unpaid_followup_sends` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `member_id`  INT          NOT NULL,
  `brand_id`   INT          NOT NULL,
  `step`       VARCHAR(32)  NOT NULL COMMENT 'day0 | day1 | day3 | day7 | abandoned',
  `sent_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dry_run`    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = logged only, no real email sent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_followup_member_brand_step` (`member_id`, `brand_id`, `step`),
  KEY `idx_followup_member` (`member_id`),
  KEY `idx_followup_brand` (`brand_id`),
  KEY `idx_followup_step_sent` (`step`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

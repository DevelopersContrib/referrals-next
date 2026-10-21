-- Reoon email checks for the admin Sign-ups report. Additive only: one new table.
CREATE TABLE IF NOT EXISTS member_email_checks (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  member_id     INT          NULL,
  email         VARCHAR(200) NOT NULL,
  status        VARCHAR(32)  NOT NULL,
  verdict       VARCHAR(8)   NOT NULL,
  is_disposable TINYINT(1)   NULL,
  score         INT          NULL,
  source        VARCHAR(16)  NOT NULL DEFAULT 'signup',
  checked_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_member_email_checks_member (member_id),
  INDEX idx_member_email_checks_checked (checked_at),
  INDEX idx_member_email_checks_verdict (verdict)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

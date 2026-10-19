-- B16 Win-back $1 first-month offer
-- Additive only. Do NOT run until Maida approves.
--
-- 1) New plans row: "Brand, monthly — $1 first month"
--    Hidden from /pricing via WINBACK_PLAN_ID code-level rule (no DB column needed).
--    price = 1.00, unit = month, days = 30, no_of_domains = 1
--
-- 2) winback_email_log table tracks every email sent by the win-back job.

-- ⚠️  Before running: verify that plans id=7 is free:
--     SELECT id FROM plans WHERE id = 7;
-- If a row already exists, pick a different id and update WINBACK_PLAN_ID in
-- src/lib/billing-constants.ts to match.

INSERT INTO plans (id, name, price, unit, days, no_of_domains, campaigns_participants)
VALUES (7, 'Brand, monthly — $1 first month', 1.00, 'month', 30, 1, 0);

CREATE TABLE IF NOT EXISTS winback_email_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  member_id     INT           NOT NULL,
  brand_id      INT           NOT NULL,
  email         VARCHAR(200)  NOT NULL,
  sent_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  batch_number  INT           NOT NULL DEFAULT 0,
  status        VARCHAR(50)   NOT NULL DEFAULT 'sent',
  error_message TEXT          NULL,
  INDEX idx_winback_member (member_id),
  INDEX idx_winback_brand (brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

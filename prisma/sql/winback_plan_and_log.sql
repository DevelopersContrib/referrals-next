-- B16 Win-back $1 first-month offer
-- Additive only. Do NOT run until Maida approves.
--
-- 1) New plans row: "Brand, monthly — $1 first month"
--    is_for_sale = 0 keeps it off /pricing. Only reachable via direct link.
--    price = 1.00, unit = month, days = 30, no_of_domains = 1
--
-- 2) winback_email_log table tracks every email sent by the win-back job.

-- Add is_for_sale column if it does not exist yet.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_for_sale TINYINT NOT NULL DEFAULT 1;

INSERT INTO plans (id, name, price, unit, days, no_of_domains, campaigns_participants, is_for_sale)
VALUES (7, 'Brand, monthly — $1 first month', 1.00, 'month', 30, 1, 0, 0);

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

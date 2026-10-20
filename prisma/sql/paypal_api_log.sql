-- PayPal REST error log for the admin PayPal Errors page.
-- Additive only: one new table, no changes to existing ones.
CREATE TABLE IF NOT EXISTS paypal_api_log (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mode       VARCHAR(8)   NOT NULL DEFAULT 'live',
  operation  VARCHAR(64)  NOT NULL,
  method     VARCHAR(8)   NOT NULL,
  path       VARCHAR(255) NOT NULL,
  status     INT          NOT NULL,
  debug_id   VARCHAR(64)  NULL,
  error_name VARCHAR(128) NULL,
  message    TEXT         NULL,
  details    TEXT         NULL,
  PRIMARY KEY (id),
  INDEX idx_paypal_api_log_created (created_at),
  INDEX idx_paypal_api_log_operation (operation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

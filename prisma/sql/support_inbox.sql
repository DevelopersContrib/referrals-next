-- Portable support inbox for Referrals.com (additive; safe to re-run)
-- mysql … referral_program < prisma/sql/support_inbox.sql

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(24) NOT NULL,
  member_id INT NULL,
  requester_email VARCHAR(255) NULL,
  requester_name VARCHAR(120) NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'contact_form',
  site VARCHAR(40) NULL,
  subject VARCHAR(200) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'other',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  assigned_admin_id INT NULL,
  ai_handling TINYINT(1) NOT NULL DEFAULT 1,
  ai_turn_count INT NOT NULL DEFAULT 0,
  escalated_at DATETIME(0) NULL,
  escalation_reason VARCHAR(500) NULL,
  last_message_at DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY support_tickets_public_id_key (public_id),
  INDEX idx_support_tickets_site_status (site, status, last_message_at),
  INDEX idx_support_tickets_requester_email (requester_email)
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id INT NOT NULL AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  author_type VARCHAR(20) NOT NULL,
  author_id INT NULL,
  body TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  INDEX idx_support_ticket_messages_ticket (ticket_id),
  INDEX idx_support_ticket_messages_ticket_created (ticket_id, created_at),
  CONSTRAINT support_ticket_messages_ticket_fk FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
);

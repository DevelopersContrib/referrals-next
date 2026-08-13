-- Emails & AI (engagement) tables for Referrals.com
-- Additive; safe to re-run. domain_key = 'referrals'
-- mysql … referral_program < prisma/sql/engagement_emails_ai.sql

CREATE TABLE IF NOT EXISTS engagement_segments (
  id INT NOT NULL AUTO_INCREMENT,
  domain_key VARCHAR(40) NOT NULL DEFAULT 'referrals',
  segment_key VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  rules_json TEXT NOT NULL,
  source VARCHAR(24) NOT NULL DEFAULT 'ai',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY uq_engagement_segments_domain_key (domain_key, segment_key),
  INDEX idx_engagement_segments_domain (domain_key)
);

CREATE TABLE IF NOT EXISTS engagement_campaigns (
  id INT NOT NULL AUTO_INCREMENT,
  domain_key VARCHAR(40) NOT NULL DEFAULT 'referrals',
  campaign_key VARCHAR(64) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  segment_key VARCHAR(64) NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY uq_engagement_campaigns_domain_key (domain_key, campaign_key),
  INDEX idx_engagement_campaigns_domain (domain_key),
  INDEX idx_engagement_campaigns_segment (domain_key, segment_key)
);

CREATE TABLE IF NOT EXISTS engagement_steps (
  id INT NOT NULL AUTO_INCREMENT,
  domain_key VARCHAR(40) NOT NULL DEFAULT 'referrals',
  campaign_key VARCHAR(64) NOT NULL,
  vnoc_mail_id INT NOT NULL,
  step_order INT NOT NULL DEFAULT 0,
  delay_days INT NOT NULL DEFAULT 0,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  synced_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY uq_engagement_steps_domain_mail (domain_key, vnoc_mail_id),
  INDEX idx_engagement_steps_campaign (domain_key, campaign_key, step_order)
);

CREATE TABLE IF NOT EXISTS engagement_enrollments (
  id INT NOT NULL AUTO_INCREMENT,
  domain_key VARCHAR(40) NOT NULL DEFAULT 'referrals',
  user_id INT NOT NULL,
  campaign_key VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  current_step INT NOT NULL DEFAULT 0,
  next_at DATETIME(0) NULL,
  context_json TEXT NULL,
  enrolled_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  completed_at DATETIME(0) NULL,
  updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (id),
  UNIQUE KEY uq_engagement_enroll (domain_key, user_id, campaign_key),
  INDEX idx_engagement_enroll_due (domain_key, status, next_at)
);

CREATE TABLE IF NOT EXISTS engagement_sends (
  id INT NOT NULL AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  step_order INT NOT NULL,
  vnoc_mail_id INT NULL,
  sent_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  status VARCHAR(24) NOT NULL DEFAULT 'sent',
  error VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_engagement_send (enrollment_id, step_order),
  INDEX idx_engagement_sends_enrollment (enrollment_id),
  CONSTRAINT engagement_sends_enrollment_fk FOREIGN KEY (enrollment_id) REFERENCES engagement_enrollments (id) ON DELETE CASCADE
);

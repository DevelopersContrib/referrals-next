-- AI Brand Intelligence onboarding pipeline tables.
-- Additive only: does not touch any existing table.
-- Run this on the referrals (DATABASE_URL) MySQL database, then run:
--   pnpm prisma db pull && pnpm prisma generate
-- (Prisma models mirroring these are also committed to schema.prisma so the
--  app compiles before db pull; db pull will simply reconcile them.)

-- Job header: one row per analysis run.
CREATE TABLE IF NOT EXISTS `brand_analysis` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `member_id`      INT NOT NULL,
  `url_id`         INT NULL,
  `input_url`      VARCHAR(255) NOT NULL,
  `domain`         VARCHAR(191) NOT NULL,
  `status`         VARCHAR(20) NOT NULL DEFAULT 'pending',
  `in_vnoc`        TINYINT(1) NOT NULL DEFAULT 0,
  `vnoc_id`        INT NULL,
  `overall_health` INT NULL,
  `website_score`  INT NULL,
  `social_score`   INT NULL,
  `referral_score` INT NULL,
  `error`          TEXT NULL,
  `started_at`     TIMESTAMP NULL,
  `completed_at`   TIMESTAMP NULL,
  `date_added`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ba_member` (`member_id`),
  KEY `idx_ba_domain` (`domain`),
  KEY `idx_ba_url` (`url_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-module work items = the queue.
CREATE TABLE IF NOT EXISTS `brand_analysis_module` (
  `id`           INT NOT NULL AUTO_INCREMENT,
  `analysis_id`  INT NOT NULL,
  `module`       VARCHAR(40) NOT NULL,
  `status`       VARCHAR(20) NOT NULL DEFAULT 'pending',
  `attempts`     INT NOT NULL DEFAULT 0,
  `depends_on`   VARCHAR(120) NULL,
  `error`        TEXT NULL,
  `started_at`   TIMESTAMP NULL,
  `completed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bam_analysis` (`analysis_id`),
  KEY `idx_bam_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- VNOC-sourced authoritative data (provenance).
CREATE TABLE IF NOT EXISTS `brand_vnoc` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `analysis_id`    INT NOT NULL,
  `matched`        TINYINT(1) NOT NULL DEFAULT 0,
  `vnoc_domain_id` INT NULL,
  `name`           VARCHAR(255) NULL,
  `logo_url`       VARCHAR(500) NULL,
  `description`    TEXT NULL,
  `tagline`        VARCHAR(1024) NULL,
  `socials`        JSON NULL,
  `raw`            JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bv_analysis` (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Crawl + extraction result.
CREATE TABLE IF NOT EXISTS `brand_crawl` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `analysis_id`      INT NOT NULL,
  `name`             VARCHAR(255) NULL,
  `logo_url`         VARCHAR(500) NULL,
  `favicon_url`      VARCHAR(500) NULL,
  `title`            VARCHAR(255) NULL,
  `meta_description` TEXT NULL,
  `primary_cta`      VARCHAR(255) NULL,
  `colors`           JSON NULL,
  `fonts`            JSON NULL,
  `products`         JSON NULL,
  `services`         JSON NULL,
  `pricing`          JSON NULL,
  `emails`           JSON NULL,
  `phones`           JSON NULL,
  `addresses`        JSON NULL,
  `languages`        JSON NULL,
  `currencies`       JSON NULL,
  `pages_crawled`    INT NULL,
  `raw`              JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bc_analysis` (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Discovered social profiles (one row per platform).
CREATE TABLE IF NOT EXISTS `brand_social` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `analysis_id` INT NOT NULL,
  `platform`    VARCHAR(40) NOT NULL,
  `url`         VARCHAR(500) NOT NULL,
  `verified`    TINYINT(1) NOT NULL DEFAULT 0,
  `source`      VARCHAR(20) NOT NULL DEFAULT 'crawl',
  PRIMARY KEY (`id`),
  KEY `idx_bs_analysis` (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI brand profile.
CREATE TABLE IF NOT EXISTS `brand_intelligence` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `analysis_id`     INT NOT NULL,
  `summary`         TEXT NULL,
  `industry`        VARCHAR(255) NULL,
  `icp`             TEXT NULL,
  `target_audience` TEXT NULL,
  `products`        TEXT NULL,
  `usp`             TEXT NULL,
  `brand_voice`     VARCHAR(255) NULL,
  `advantages`      JSON NULL,
  `weaknesses`      JSON NULL,
  `opportunities`   JSON NULL,
  `readiness_score` INT NULL,
  `raw`             JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bi_analysis` (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generated campaign suggestions (3 per analysis).
CREATE TABLE IF NOT EXISTS `brand_campaign_suggestion` (
  `id`                   INT NOT NULL AUTO_INCREMENT,
  `analysis_id`          INT NOT NULL,
  `kind`                 VARCHAR(30) NOT NULL,
  `name`                 VARCHAR(255) NULL,
  `reward_type`          VARCHAR(60) NULL,
  `headline`             VARCHAR(500) NULL,
  `description`          TEXT NULL,
  `payload`             JSON NULL,
  `predicted_conversion` VARCHAR(30) NULL,
  `predicted_referrals`  VARCHAR(30) NULL,
  `estimated_roi`        VARCHAR(60) NULL,
  `sort_order`           INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_bcs_analysis` (`analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

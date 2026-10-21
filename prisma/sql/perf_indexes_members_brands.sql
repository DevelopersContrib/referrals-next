-- Speed up "this member's brands" lookups and sign-up date reports.
-- Additive only: two indexes, no data changes. InnoDB builds these online.
ALTER TABLE member_urls ADD INDEX idx_member_urls_member_id (member_id);
ALTER TABLE members ADD INDEX idx_members_date_signedup (date_signedup);

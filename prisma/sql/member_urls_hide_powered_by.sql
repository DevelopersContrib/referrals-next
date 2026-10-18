-- Owner switch for the "Powered by Referrals.com" link on public pages.
-- Additive; every brand starts with the link shown.
ALTER TABLE member_urls
  ADD COLUMN hide_powered_by TINYINT(1) NOT NULL DEFAULT 0;

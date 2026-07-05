-- Store an AI-generated (or manually tuned) brand color palette per brand.
-- JSON shape: { "primary": "#rrggbb", "secondary": "...", "accent": "...",
--               "background": "...", "text": "..." }
-- Additive / non-destructive.
ALTER TABLE `member_urls`
  ADD COLUMN `brand_colors` JSON NULL;

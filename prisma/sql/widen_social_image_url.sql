-- Widen campaign_social_content.image_url so it can hold real image URLs
-- (S3/CDN URLs and AI-generated campaign images exceed the old 100-char limit).
-- Non-destructive: only increases the column length.
ALTER TABLE `campaign_social_content`
  MODIFY `image_url` VARCHAR(500) NULL;

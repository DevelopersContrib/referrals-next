-- Link each payment to the brand it paid for (per-brand billing + history).
-- Additive: nullable column + index; existing rows keep NULL until backfilled.
ALTER TABLE member_payment
  ADD COLUMN url_id INT NULL,
  ADD INDEX idx_member_payment_url (url_id);

-- Backfill: first-payment rows store the PayPal subscription id as
-- transaction_id, which url_plan.paypal_agreement_id also holds.
UPDATE member_payment mp
JOIN url_plan up
  ON up.paypal_agreement_id = mp.transaction_id
 AND up.member_id = mp.member_id
SET mp.url_id = up.url_id
WHERE mp.url_id IS NULL;

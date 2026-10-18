# B4 — Production checkout verification checklist

**VNOC-66165** · Status: code/tools ready, prod test pending.

## Prerequisites

The Oct 18 billing code must be deployed to production before this test.
The following items were verified on `main` (as of Oct 18 2026):

| Item | Commit | Status |
|------|--------|--------|
| B1 — Second brand + Agency/Unlimited brand coverage | `9c55a14` | **On main** |
| B2 — Checkout requires a brand; payment stamps `url_id` | `9c55a14` | **On main** |
| B3 — PayPal payment marks member verified | `9c55a14` | **On main** |
| B4 code — Stored plan reuse (ACTIVE only); fallback to redirect | `9c55a14` | **On main** |
| B5 — `/billing` lists brands Live/Private with Publish/Cancel | `9c55a14` + `19a3fbf` | **On main** |
| B7 — Brand owner can test-signup on unpaid widget | `9c55a14` | **On main** |
| B9 — `/pricing` and `/billing` show new plan names | `9c55a14` | **On main** |
| B11–B14 — No dup first month; renewal `days`; `extendPaidSubscriptionPeriod` | `9c55a14` | **On main** |
| B15 — Prod stays live; sandbox is localhost only | Env config | **On main** |
| Checkout event + webhook tables | `9c55a14` | **On main** |

## Steps — Lee / Ronan

1. **Confirm deploy.** Verify the latest `main` SHA is on Vercel production:
   ```bash
   # Check Vercel dashboard or:
   curl -s https://www.referrals.com | grep -o 'buildId":"[^"]*"' | head -1
   ```

2. **Run the checkout health script** (from a machine with DB access):
   ```bash
   npx tsx scripts/billing-checkout-health.ts --since 7d
   ```
   Check:
   - `server_error` and `client_error` counts should be 0 or explainable.
   - `billing_paypal_webhook_events` should show verified deliveries if any
     webhooks fired.

3. **Report findings to Maida** before the $9 purchase.

## Steps — Maida ($9 test purchase)

4. **Make the $9 purchase:**
   - Go to `https://www.referrals.com/billing` while logged in.
   - Pick a brand that is currently **Private**.
   - Click **Publish** → complete the $9/mo PayPal checkout.
   - Wait for the PayPal redirect or in-page confirmation.

5. **Verify after purchase:**
   - [ ] The brand shows **Live** on `/billing`.
   - [ ] The brand's public page (`/p/<domain>`) loads and is not gated.
   - [ ] `member_payment` has a new row with `url_id` = the brand's id.
   - [ ] `url_plan` has a new row with `paypal_agreement_id` set.
   - [ ] `member_urls.plan_expiry` is ~30 days from now.
   - [ ] `billing_checkout_events` has an `activated` row for this attempt.

6. **Run health check again:**
   ```bash
   npx tsx scripts/billing-checkout-health.ts --since 1h
   ```
   - [ ] The `activated` event appears.
   - [ ] No new `server_error` or `client_error` events.
   - [ ] If a PayPal webhook fired, it shows as verified.

## Done when

- [ ] Oct 18 billing code is on production
- [ ] `billing_checkout_events` checked for errors; findings reported to Maida
- [ ] One real $9 purchase went through end to end
- [ ] The brand went live

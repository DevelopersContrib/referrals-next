# Referrals PHP vs Next.js — Gap Analysis & Plan

## Context

The Referrals platform (`referrals.com`) exists in three codebases:
- **PHP (Yii):** `referrals.com/referrals2026/` — the live production frontend (50 controllers, 60+ models)
- **PHP (CodeIgniter):** `referrals.com/api.referrals.com/` — REST API backend (brand, campaign, member, signup, zapier, framework controllers)
- **Next.js:** `referrals.com/referrals-next/` — the rewrite (App Router, Prisma, NextAuth, same MySQL DB)

Both PHP and Next.js talk to the **same RDS MySQL database** (Prisma schema has 70+ models matching the PHP tables). The goal: identify what PHP does that Next.js doesn't yet, and plan to close those gaps.

---

## Feature-by-Feature Comparison

### FULLY PORTED (Next.js has parity or better)

| Feature | PHP | Next.js |
|---------|-----|---------|
| **Brands CRUD** | BrandController (1114 lines) | `/api/brands`, `/brands/*` pages, edit, bulk, export, socials, subdomains |
| **Campaign CRUD** | CampaignController (1929 lines) | `/api/campaigns`, create/edit/dashboard/list, campaign types, publish toggle |
| **Campaign Widget** | WidgetController (2282 lines) | `/api/widget/*` (signup, share, click, impression, invite, reward, vote, JS embed) + widget pages (embed/popup) |
| **Participants** | CampaignParticipants model + ajax | `/api/campaigns/[id]/participants`, participant pages, export |
| **Rewards** | CampaignReward model + reward forms | `/api/widget/reward` (coupons, redirects, tokens, cash) |
| **Widget Templates** | WidgetController + templates | Widget customizer page (551 lines), template system |
| **Lander / Landing Pages** | LanderController (customize, preview, save) | `/api/lander` + lander pages with template preview |
| **Social Sharing** | WidgetController share actions | `/api/widget/share`, `/api/widget/click`, social content |
| **Forum** | ForumController + ForumajaxController | `/api/forum/*` (posts, comments, votes), forum pages (index, categories, post, edit, unanswered, activity) |
| **Deals** | DealsController | `/api/deals`, deals CRUD pages |
| **Billing/Plans** | BillingController + PaypalController + StripeController | `/api/billing/*` (subscribe, cancel, suspend, reactivate, webhook, plans), billing pages |
| **Auth** | SigninController + SignupController | NextAuth (`[...nextauth]`), register, forgot/reset password, verify email |
| **Account** | AccountController | `/account` page, profile update, change password, API key generation |
| **Dashboard** | DashboardController (stats widgets) | `/dashboard` page (508 lines), `/api/dashboard/stats` |
| **Contacts** | ContactsController | `/api/contacts`, contacts page |
| **Coupons** | CouponsController | `/admin/coupons` page + route |
| **Reviews** | ReviewsController | `/tools/reviews` page + `/admin/reviews` |
| **Testimonials** | TestimonialajaxController | `/tools/testimonials` + `/admin/testimonials` |
| **Promotions** | PromotionController | `/api/promotions`, promotions page |
| **Notifications** | NotificationsController | `/api/notifications`, notifications page |
| **Mailchimp Integration** | MailchimpController | `/integrations/mailchimp` page + route |
| **Shopify Integration** | ShopifyController (OAuth, widgets) | `/integrations/shopify/oauth` route |
| **Zapier Integration** | api.referrals.com zapier controller | `/api/integrations/zapier` + `/api/v1/zapier/*` |
| **Cron Jobs** | CronController (contest winners, payments, feeds, impressions) | `/api/cron/*` (contest-winners, plan-expiry, update-feeds, update-impressions, update-payments) |
| **Public Brand Pages** | PublicController | `/p/[slug]`, `/p/[slug]/campaign/[id]`, `/p/[slug]/participants` |
| **Invite/Referral Links** | Widget redirect actions (`/t/<code>`) | `/t/[code]`, `/t2/[code]`, `/invite/[id]` routes |
| **Stats** | StatsController + BrandajaxController | `/stats` page + `/api/brands/[id]/stats` + `/api/campaigns/[id]/stats` |
| **Contests/Voting** | ContestController + VotingController | `/admin/contests`, `/api/widget/vote` |
| **Editor** | EditorController | `/editor` page |
| **Subdomains** | SubdomainController | `/brands/[id]/subdomain` page + `/api/brands/[id]/subdomain` |
| **Sitemap** | SitemapController | `/sitemap.xml/route.ts` |
| **Admin Panel** | (embedded in Yii) | Full `/admin/*` section: members, campaigns, brands, plans, payments, blog, email-templates, cron, integrations, settings, etc. |

### NEXT.JS HAS BUT PHP DOESN'T

| Feature | Next.js Location |
|---------|-----------------|
| **AI Campaign Assist** | `/api/campaigns/ai/assist` (313 lines) — AI-powered campaign creation |
| **v1 REST API** | `/api/v1/*` — versioned public API (auth/token, brands, campaigns, members, participants, signups, webhooks, zapier) |
| **Blog with AI Generation** | `/api/admin/blog/generate` + `/blog/[slug]` + MDX content system |
| **Campaign Requirements** | `/api/campaigns/[id]/requirements` (127 lines) |
| **Brand Bulk Operations** | `/brands/bulk` page + `/api/brands/all/delete` + `/api/brands/all/export` |
| **Webhook Management** | `/api/v1/webhooks` CRUD |
| **Admin Member Impersonation** | `/api/admin/members/[id]/impersonate` |
| **Marketing Pages** | About, features, how-it-works, pricing, developer/docs, partners, community, services, ambassador, affiliate, knowledgebase, walkthrough, whitelabel, campaign-templates, cookie-policy |
| **RSS/Blog Feed** | `/blog/feed.xml` |
| **Agent Protocol** | `/.well-known/agent.json` |

### GAPS — PHP HAS BUT NEXT.JS IS MISSING OR INCOMPLETE

| Gap | PHP Implementation | What's Missing in Next.js |
|-----|-------------------|--------------------------|
| **FullContact Enrichment** | `SignupController::actionCheckfullcontact()` — enriches signups with FullContact data | No equivalent; signups don't enrich contact data |
| **Bitly Link Shortening** | `Bitly` component used in widget share URLs | Share links are raw URLs, no shortening |
| **AWS SES Event Webhooks** | `SendgrideventController` — processes email open/click/bounce events (migrated from SendGrid to SES) | No SES webhook/SNS handler; email event tracking missing |
| **Gmail Contact Import** | `WidgetController::actionInviteGmail`, `actionGmailContacts` | No Gmail contacts integration for invite flows |
| **Affiliate Sales Warrior** | `AffiliateController` + `AffiliateSalesWarrior` model | `/affiliate` is a public marketing page only; no affiliate tracking/payout system |
| **Facebook Integration** | `CampaignIntegrations` (facebook_page, facebook_app_id, secure_url) + ToolsController facebook | Campaign integration has Mailchimp/Shopify but no Facebook page integration |
| **Campaign Email Content** | `CampaignEmailContent` model + `actionShowrewardemails`, `actionShowrewardemailsvote` | Email template editing per-campaign not exposed in UI |
| **Vercel Deployment API** | `Vercelapi` component — programmatic Vercel project/domain setup for whitelabel brands | No Vercel API integration for whitelabel provisioning |
| **Brand Whitelabel Full Setup** | `BrandController::actionUpdatewhitelabel` — creates whitelabel config (custom domain, meta, scripts, featured campaign) | Whitelabel page is marketing-only; no actual whitelabel provisioning |
| **Top Referrer Sites** | `CampaignController::actionTopreferrersites` | No top-referrer analytics endpoint |
| **Rapid/Try Demo** | `RapidController`, `TryController` | No quick-start demo flow |
| **Feed Aggregation** | `FeedController` | No feeds page/route |
| **Deal Click Tracking** | `DealClicks` model + tracking | Deals exist but click tracking model not wired |
| **Banner Upload** | `BanneruploadajaxController`, `ShareuploadajaxController`, `WidgetuploadajaxController` — specialized upload handlers | Generic `/api/upload` exists but no specialized widget/banner/share uploaders |
| **Coupon Upload (CSV)** | `CouponuploadajaxController` | No bulk coupon import |
| **Campaign Challenges** | `CampaignChallenges` model + `actionShowchallenges`, `actionCreatechallenge`, `actionCreatechallengequiz` | Challenge/quiz creation not in Next.js |
| **Preset Campaigns** | `actionShowpresetcampaigns`, `actionPresetvalues` | No campaign presets/templates system |

---

## Priority Plan

### P0 — Critical for launch parity (blocks user workflows)

- [ ] **AWS SES Event Webhooks** — email open/click/bounce tracking drives campaign analytics. Without it, members can't see email performance.
  - Create `/api/webhooks/ses/route.ts` — handle SNS notifications (Delivery, Bounce, Complaint, Open, Click)
  - Parse SES event payload, update email event tracking table

- [ ] **Campaign Email Templates** — members need to customize reward/entry emails per campaign.
  - Expose `campaign_email_content` CRUD in `/api/campaigns/[id]/emails/route.ts` (page exists at 353 lines but verify it writes back)
  - Wire save to Prisma `campaign_email_content`

- [ ] **Whitelabel Provisioning** — currently marketing-only. Need actual whitelabel setup flow.
  - Create `/api/brands/[id]/whitelabel/route.ts` — save `brand_whitelabel` config
  - Wire Vercel API for custom domain verification (use existing `Vercelapi` logic as reference)

### P1 — Important for feature completeness

- [ ] **Gmail Contact Import** — invite flow is weaker without it. Members can't bulk-invite from Gmail.
  - Google People API OAuth + contact fetch
  - Wire into widget invite flow
  - Reference: PHP `WidgetController::actionInviteGmail` + `actionGmailContacts`

- [ ] **Facebook Page Integration** — campaigns lose a distribution channel without it.
  - Save `campaign_integrations` facebook fields
  - Facebook Graph API for page post (if still used)

- [ ] **Affiliate Tracking System** — PHP has `AffiliateSalesWarrior` model for tracking affiliate sales + payouts.
  - Create `/api/affiliates/*` routes
  - Wire `affiliate_sales_warrior` Prisma model (already in schema)

- [ ] **FullContact Enrichment** — nice-to-have for signup quality.
  - Add enrichment call in `/api/widget/signup` POST handler
  - Or replace with Clearbit/Apollo if FullContact deprecated

- [ ] **Campaign Challenges/Quizzes** — gamification feature exists in PHP.
  - Expose `campaign_challenges` CRUD
  - Quiz creation UI

### P2 — Nice to have / can defer

- [ ] **Bitly Link Shortening** — cosmetic; raw share links work fine
- [ ] **Deal Click Tracking** — wire `deal_clicks` model to track click events
- [ ] **Bulk Coupon CSV Import** — specialized uploader
- [ ] **Preset Campaign Templates** — pre-built campaign configs for quick setup
- [ ] **Rapid/Try Demo** — quick-start flow for new users
- [ ] **Top Referrer Sites Analytics** — one new query endpoint
- [ ] **Feed Aggregation** — low priority

---

## Summary

The Next.js rewrite is **~85% complete**. Core flows (brands, campaigns, widgets, participants, rewards, billing, auth, admin) are fully ported with good code quality (typed, Prisma, proper API routes). The Next.js version actually surpasses PHP in several areas (AI assist, versioned API, blog, webhooks, bulk ops).

The main gaps are in **integrations** (SES events, Gmail contacts, Facebook, FullContact, Vercel whitelabel provisioning) and **secondary features** (challenges, presets, affiliate tracking, deal click tracking). None are architectural blockers — they're additive features that can be built incrementally.

# Referrals.com — Growth Brief (more paying subscribers)

## Context / stack (reuse, don't reinvent)

- **Framework:** Next.js 16, App Router (`src/app`), route groups `(public)` / `(dashboard)` / `(admin)`.
- **Auth:** NextAuth v5 (Google, Facebook, credentials) in `src/lib/auth.ts`, on Prisma `members` table (supports legacy plaintext + bcrypt passwords).
- **UI:** shadcn / base-ui components (`components.json`), `lucide-react`, `next-themes`. Match the existing design system.
- **Payments:** PayPal (`@paypal/paypal-server-sdk`) — already integrated. Use it; do not add a second payment lib.
- **Existing routes:** `src/app/plans` (pricing), `src/app/blog` (+ `feed.xml`), `src/app/sitemap.xml`, `public/[slug]`, `/p`, `/t`, invite/widget flows.

**Goal:** convert more free users into paying subscribers. Reuse existing components, NextAuth, Prisma, and PayPal. Do NOT touch the legacy Yii app or change the `members` schema beyond adding subscription/trial fields (confirm before any schema change).

**Priority:** Workstream 1 → 2 → 3. Ship Workstream 1 as its own PR.

---

## Workstream 1 — Signup / onboarding redesign (do first)

The current signup is a plain single-column form (Full Name, Email, Password, "Your Website") with no reassurance, no social proof, and no password guidance. Rework the signup route under `src/app/(public)`:

1. **Split-screen layout:** form on the left; value panel on the right with a testimonial, "500k+ subscribers," and the live-activity ticker (reuse the homepage social-proof component).
2. **Social-first:** render **Continue with Google** and **Continue with Facebook** ABOVE the email fields, then an "or sign up with email" divider. Wire to NextAuth `signIn()`.
3. **Cut to 3 fields:** Full Name, Email, Password. **Remove "Your Website"/first-brand from signup** — collect it in a post-signup onboarding step.
4. **Reassurance line** under the CTA: "Free to start · No credit card · Launch in 10 minutes."
5. **Password field:** show/hide toggle + inline requirement hints.
6. **One screen, no nav distractions;** add a subheadline under the headline.
7. **Post-submit = activation:** redirect into a guided "Launch your first campaign" onboarding (collect website/brand here), ending at the dashboard.

**Acceptance:** fewer fields, social buttons first, reassurance visible, works with existing NextAuth flow, mobile-responsive.

---

## Workstream 2 — Pricing & paid conversion

Pricing is **usage-based, not tiered, not feature-gated**:

- **FREE:** 1 campaign / 1 domain, **fully functional** — no feature is ever gated (gamification, voting, analytics, widgets, anti-fraud all work on free).
- **PAID:** **$9/month per additional domain** — a monthly PayPal subscription per domain.
- **No annual option, no tiers, no monthly/annual toggle.**

1. **`src/app/plans`** messaging: *"Your first campaign is free. Add a domain for $9/month."* Show the full feature list as included for everyone. Optional cost line: N additional domains × $9/mo.
2. **Enforce the only limit** in app logic: a free account has exactly 1 active campaign/domain. All feature flags stay ON regardless of plan.
3. **Conversion moment:** when a user tries to create a 2nd campaign or connect a 2nd domain, show a **"$9/month — add this domain"** modal → PayPal monthly subscription → unlock that domain.
4. **Model each domain as its own $9/mo subscription unit** (cancel = stop billing that unit). Store subscription state on the member/domain record.
5. **"Powered by referrals.com"** (UTM link) on all free-tier campaign widgets/pages — viral surface + attribution, NOT a feature gate, so it stays on free.
6. **Dogfood:** a referral program for referrals.com — *"refer a business, get a domain credit ($9 off)."* Reuse the existing invite/widget flow; credit both sides on paid conversion.
7. **Proof:** turn testimonials into case studies with a number + timeframe; add a simple ROI calculator on the pricing/landing page.

**Acceptance:** free users get 1 fully-working campaign; attempting a 2nd domain/campaign triggers the $9/mo PayPal flow; after paying, the new domain unlocks; no feature is ever hidden behind a plan.

---

## Workstream 3 — SEO

Good base already exists (blog, `feed.xml`, `sitemap.xml`). Amplify:

1. **Per-route metadata:** unique title/description/OG + canonical on every public route (home, plans, blog posts, `public/[slug]`, `/p`, `/t`). Add JSON-LD: `SoftwareApplication` + `FAQ` on marketing pages, `Article` on blog posts.
2. **Programmatic pages:** `src/app/(public)/referral-program-for/[useCase]` generating "Referral program for {SaaS | ecommerce | agencies | gyms | …}" guide+CTA pages from a content map. Add to sitemap.
3. **Index public surfaces:** ensure `public/[slug]`, `/p`, `/t` campaign/invite pages are indexable with real metadata (they're natural landing pages).
4. **Extend `sitemap.xml`** to include blog posts, public campaigns, and the programmatic pages.
5. **Content hub:** a "referral marketing" pillar page + internal links from cluster blog posts.
6. **Technical:** canonicals, H1 discipline, internal linking, Core Web Vitals.
7. **Network advantage:** backlinks from the 25k eCorp/VNOC domains + every "Powered by referrals.com" link = domain authority competitors can't buy.

**Acceptance:** every public page has unique metadata + canonical, JSON-LD validates, sitemap includes all indexable URLs, the programmatic route renders for a `useCase` param.

---

## Guardrails

- Reuse existing shadcn components + NextAuth + Prisma + PayPal. No new UI/auth/payment libraries.
- Keep the current visual style.
- Don't touch the legacy Yii app. Confirm before any `members`-schema change (only add subscription/domain-billing fields if needed).

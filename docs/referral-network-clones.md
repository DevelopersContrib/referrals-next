# Referral network clones: plan

Status (2026-10-21): option A chosen. Phases 1, 2 and 4 are built locally and **not committed or deployed**:
- `src/lib/network-sites.ts`: the clone list (referrals.net and referralprogram.com, both `enabled: true` since 2026-10-21 go-live) and routing rules
- `src/proxy.ts`: clone hosts get their own pages; sign-in, sign-up and everything else go to referrals.com; `/network/*` is hidden on referrals.com
- `src/app/network/[site]/`: layout (metadata, canonical, VNOC Analytics `data-domain`), home, how-it-works, pricing, robots.txt, sitemap.xml
- `src/components/network/`, `src/components/auth/network-via-note.tsx`: clone header and footer, plan cards, and the "Continuing from …" note on `/signin` and `/signup`
- Tests: `src/lib/network-sites.test.ts`, plus new cases in `src/proxy.test.ts`

Four designs (`design` in each clone's config): **Studio** (dark, product-first), **Storefront** (warm, the widget shown on a sketch of the shop's site), **Poster** (bold condensed type on a color block), all three with a playful layer (cartoon faces, confetti, ticker, stickers), and **Professional** (calm, serif headlines, no confetti). Locally, add `?design=studio|storefront|poster` or use the switcher bar at the bottom; production uses only the config.

Preview locally at `http://referrals-net.localhost:<port>/` and `http://referralprogram.localhost:<port>/`. In dev, links to the app go to `app.localhost`, because Next turns redirects to plain `localhost` into same-host redirects.

Next: phase 3 (go-live for each domain) needs your OK for each DNS switch.

Researched 2026-10-21.

## The short version

- We own about 74 domains with "referral" in the name, plus about 36 more with "refer" (all at NameBright, in the VNOC portfolio). Today none of them except referralsgroup.com runs on Vercel. They're all behind Cloudflare and show either an eCorp "for sale" page or an AI-built "Smart Entity" page from a Cloudflare Worker.
- **Recommendation: Option A.** The referrals-next app we already run also serves each clone domain. It works out which clone it is from the domain name, the same way it already handles brand white-label domains in `src/proxy.ts`. Each clone gets its own name, logo, colors, copy and a small set of public pages. **Every signed-in page (sign-in, sign-up, dashboard, billing) stays on www.referrals.com.** A clone's "Sign in" and "Get started" buttons send people to referrals.com, and the sign-up is credited to the clone through the existing `/go` partner link.
- Because sign-in never happens on a clone, we don't need cross-domain sessions or handoff tokens to start. That keeps the first version small and safe.
- Adding a clone should only take a config change (one entry in one file), a domain change in Vercel, and a DNS switch.
- Start with 2 pilots, measure for 2 to 4 weeks, then decide whether to roll out more. The biggest risk is SEO: dozens of look-alike sites can hurt referrals.com's own ranking if we copy content.

---

## 1. Candidate domains we own

Sources: VNOC `search_ours_portfolio` (NameBright/TurnCommerce, owner "Asset Manager"), VNOC `search_portfolio` (30-day traffic and leads), `vercel domains inspect --scope vnoc` (read-only), live DNS, and HTTP response headers. Checked 2026-10-21.

How to read the table:
- **Serving:** what visitors see today. "Sale lander" is the eCorp "is for sale — Partner, Invest or Acquire" page. "Smart Entity" is an AI-built eCorp venture page. Both are Cloudflare Workers.
- **Vercel project:** where Vercel still lists the domain as attached. Only referrals.com and referralsgroup.com actually get their traffic from Vercel (they return an `x-vercel-id` header). On every other domain the Vercel attachment is stale and the Cloudflare Worker answers.
- **Uniques/leads:** VNOC Analytics, last 30 days. Pageviews run 15 to 30 times higher than unique visitors on most of these, which suggests a lot of bot traffic, so treat these as rough relative numbers.

### Already in use (not candidates)

| Domain | Today | Notes |
|---|---|---|
| referrals.com | The app itself (Vercel `referrals-next`, Cloudflare DNS) | 308k uniques, 7,097 leads |
| referralsgroup.com | Static case-study site (Vercel `referralsgroup`) | Keep separate, as already decided |
| referralbots.com | Live agent venture ("Refer-a-friend programs… run for you"), Worker `agent-proxy` | Already an active product. Don't replace it without your decision. |
| referralboard.com | Live board venture ("Referrals board, Deals & Listings"), Worker `board-router` | Already an active product |

### Best clone candidates (generic "referral platform" names)

| Domain | Serving | Vercel project (stale) | Cloudflare binding | Uniques / leads (30d) |
|---|---|---|---|---|
| **referrals.net** | Sale lander | – | custom domain → `ecorp-lander-dd-2` | 4,871 / 13 |
| **referralprogram.com** | Sale lander | next-js-lead-template | route → `ecorp-lander-eg-0` | 4,513 / 9 |
| **referralsystem.com** | Sale lander | next-js-lead-template | Worker (not inspected) | 4,777 / 15 |
| **referralhq.com** | Smart Entity ("Strategy to Scoreboard") | – | route → `universal-overflow-2` | 0 recorded / 0 |
| referralguru.com | Sale lander | next-js-lead-v2-framework | Worker | 3,727 / 17 |
| referraldesk.com | Smart Entity | next-js-lead-template | Worker | 3,732 / 13 |
| referralnet.com | Smart Entity | – | route → `universal-overflow-3` | 2,990 / 4 |
| referralsnetwork.com | Sale lander | next-js-lead-template | Worker | not in traffic list |
| referralscentral.com | Sale lander | next-js-lead-template | Worker | 3,999 / 0 |
| referralcentre.com | Smart Entity ("UK & Beyond") | – | Worker | 3,207 / 4 |
| referralcenter.com | Smart Entity ("Intake to Outcome") | next-js-aiframework | Worker | 2,201 / 7 |
| referralportal.com | Smart Entity | – | Worker | 5,378 / 0 |
| referralsystems.com | Sale lander | nextjs-blockchain-framework | Worker | – |
| referralservice.com / referralservices.com | Sale lander | next-js-aiframework / next-js-lead-template | Worker | 3,059 / 4 and 2,142 / 1 |
| referralmarketplace.com / referralsmarketplace.com | Smart Entity | next-js-buy-sell-v2 / – | Worker | 2,593 / 5 and – |
| referralchat.com | Smart Entity | next-js-aiframework | Worker | 2,799 / 8 |
| referralstream.com | Smart Entity ("Channel Intelligence") | next-js-buy-sell-v2 | Worker | 2,795 / 4 |
| referralforum.com | Smart Entity | next-js-lead-template | Worker | 2,661 / 0 |
| referralpage.com / referralpages.com | Smart Entity | – | Worker | 0 / 2 and 0 / 0 |
| refers.com | Smart Entity ("The Act of Referring") | – | Worker | – |
| referapp.com, referals.com, onlinereferral.com | Smart Entity | – / next-js-aiframework / – | Worker | 2,445 / 2 (onlinereferral) |
| partnerreferral.com, wwwreferral.com, referralchain.com, referralcoop.com, referralcredits.com, referralprofile.com, referralport.com | Sale lander | mixed / – | Worker | 2,000–2,500 uniques each |

### Niche / vertical names (good for later "referral programs for X" clones)

doctorsreferral.com, homereferral.net and housereferrals.com (both "Handyman Network"), collegereferrals.com ("CollegeVentures Network"), miamireferral.com, localreferral.com and localreferrals.com (sale landers), designreferral.com, productreferrals.com, ecoreferrals.com, referagent.com / referagents.com / agentrefer.com (real-estate agent referrals). They fit the existing `/referral-program-for/<industry>` pages better than a general clone.

### Special cases

- **referral.com:** sale lander, but 383 leads in 30 days, by far the most of any domain here except referrals.com. The for-sale inquiry flow seems to be working. **Don't turn it into a clone without deciding whether it's for sale.**
- **referralpad.com:** nameservers are `expired1/2.namebrightdns.com`, so it looks expired or lapsed at NameBright. Check the renewal before planning anything for it.
- **referralsnet.com:** no DNS records at all (doesn't resolve), though it's still attached to Vercel `next-js-lead-template`.
- Crypto-flavored names (referralcoin, referraltoken, referaltoken, refertoken, referralchain(s), referralblock, referraldao, bitrefer, refcoins.com on Vercel) fit the ADAO/token side better than a referral-SaaS clone.

All of these use Cloudflare nameservers, spread across several Cloudflare accounts (aspen/gordon, dexter/grannbo, alina/lakas, kayden/romina, martin/ophelia, molly/hasslo). DNS changes go through VentureOS (`unbind_domain_worker`, `move_dns`) or the Cloudflare dashboard for each account.

---

## 2. Architecture options

### Option A (recommended): one app, branded by domain

The referrals-next app adds each clone domain to its Vercel project. `src/proxy.ts` already checks the incoming domain. Today it treats any domain that isn't an app domain as a possible brand white-label domain (`brandForHost`, which looks it up in the database). We add one step before that: "is this domain one of our network clones?" It's an in-memory lookup in a config file, with no database call.

```
request → proxy.ts
  ├─ app host (referrals.com, www, beta, localhost)  → unchanged
  ├─ network clone host (referrals.net, …)           → NEW: networkSiteResponse()
  │     /                  → rewrite to /network/<key>
  │     /how-it-works etc. → rewrite to /network/<key>/how-it-works
  │     /robots.txt, /sitemap.xml → rewrite to per-clone handlers
  │     /signin            → 307 www.referrals.com/signin?via=<clone>
  │     /signup, /get-started → 307 www.referrals.com/go?ref=<clone>&url=…/signup
  │     /dashboard, /billing, anything signed-in → 307 www.referrals.com<same path>
  │     anything else      → 404 (or 307 to the clone's home)
  └─ anything else → existing brand white-label logic (brandForHost)
```

The clone pages live in their own route group (for example `src/app/(network)/network/[site]/…`) with their own layout. They don't reuse `src/app/(public)/layout.tsx`. That layout is a client component with `SessionProvider` and the Referrals.com header, and "Referrals.com" is hard-coded 215 times across 62 public-page and component files. Retrofitting all of that is the expensive path. A small set of clone pages that read from the clone's config is cheaper and safer. Shared pieces (plan prices from `plan-catalog.ts`, campaign templates, logo fallback `<BrandLogo>`) get imported, not copied.

**Sign-in:** NextAuth v5 cookies (`authjs.session-token` / `__Secure-authjs.session-token`) only work on the domain that set them. A session on referrals.com can't be read on referrals.net. Two ways to handle that:

1. **Keep every signed-in page on referrals.com (recommended).** The clone has no sessions at all. "Sign in" goes to `https://www.referrals.com/signin?via=referrals.net`. After sign-in the user stays on referrals.com and manages brands, campaigns and billing there. The referrals.com sign-in page can read `via` (checked against the clone list) and show "Continue from Referrals.net" with the clone's logo, so the jump doesn't feel like a different company. This also avoids registering every clone as a Google/Facebook OAuth redirect URI and running Turnstile on every domain.
2. **Signed one-time handoff token (only if you later want "logged in" on the clone itself).** The clone sends the user to `referrals.com/signin?return=https://referrals.net/…`. After sign-in, referrals.com creates a token that's good for 60 seconds and works once. It's HMAC-signed with `AUTH_SECRET` and holds the member id, the target domain and a unique id saved in the database so it can't be replayed. referrals.com redirects to `https://referrals.net/api/network/handoff?token=…`. The clone checks the signature, the domain, the expiry and that the token hasn't been used, then sets its own session cookie for referrals.net. Sign-out has to clear both. It works, but it's real security-sensitive code, and it only pays off if clones get their own signed-in pages. **Not in the first version.**

**SEO:**
- Each clone page sets its own canonical tag pointing at itself (`https://referrals.net/…`). The root layout currently hard-codes `metadataBase: https://www.referrals.com`, so the network layout must override `metadataBase`, `openGraph.siteName`, title template and icons for each clone.
- Clone copy must be **unique**: a different angle, audience and wording for each clone. Don't serve referrals.com's blog, knowledgebase, forum or templates on clones. If a clone links to that content, link to the referrals.com URL.
- Each clone gets its own `robots.txt` and `sitemap.xml` listing only its own pages. Today `src/app/robots.ts` and `src/app/sitemap.xml/route.ts` always describe referrals.com.
- Keep links between clones and to referrals.com to a minimum, and natural ("A Referrals.com network site" in the footer). Dozens of same-template sites all linking to each other looks like a link scheme to Google.
- Add each clone to Google Search Console as its own property.

**Shared MySQL database:** clones don't need any new tables in the first version. The clone list lives in a config file. Sign-ups, brands, campaigns and payments are all made on referrals.com, so they go into the same tables as today.

**Billing:** no change. The $9/mo per-brand PayPal plans, checkout, return URLs and webhooks all stay on referrals.com. A clone's pricing page shows the same plans (read from `plan-catalog.ts`, so prices never drift), and its buttons lead to sign-up on referrals.com.

**Analytics:** the public layout already loads `https://analytics.vnoc.com/tracker.js` with `data-domain="referrals.com"`. The network layout loads the same script with `data-domain="<clone domain>"`. These domains already report to VNOC Analytics (they show up in `search_portfolio`), so their history continues. Clones can call `window.vnoc.track("cta_signup")` on button clicks. The actual sign-up happens on referrals.com and shows up there with `utm_campaign=<clone>`.

**Attribution:** use the existing partner link, routed through referrals.com:
`https://www.referrals.com/go?ref=referrals.net&url=https://www.referrals.com/signup`

`goReferralRedirect` (`src/lib/go-referral.ts`) creates or reuses the domain participant `referrals.net@network.referrals.com` in the sign-up campaign. It then sets the `rref` cookie **on referrals.com**, adds `rref`, `utm_source=referral`, `utm_medium=domain` and `utm_campaign=referrals.net`, and redirects to sign-up. Both password sign-up (`/api/auth/register`) and Google/Facebook sign-up (`auth.ts` signIn callback) already read `rref`, so every clone sign-up is credited to its domain with no new code.

One catch: `/go/` must not run on the clone's own domain. The brand-host passthrough lets `/go/` through, and the `rref` cookie would then land on referrals.net, where sign-up never reads it. Clone buttons should always link to the referrals.com `/go` URL. Also, plain `/go/<domain>` always lands on `/signup`. Only the legacy `/go?ref=&url=` form takes a destination, which is useful for "Sign in" vs. "Pricing" vs. "Sign up".

**Pros:** one codebase and one deploy. Prices, templates and brand logos are always current. The routing pattern already exists and has tests (`src/proxy.test.ts`). No sessions to sync. Adding a clone is a config entry.
**Cons:** clone changes ship with the main app, so a mistake in `proxy.ts` could affect referrals.com. Tests and a per-clone `enabled` flag reduce that risk. It also adds domains to the main Vercel project, so more certificates for that project.

### Option B: separate thin sites

Each clone (or better, one shared "network sites" repo serving all of them by domain, like referralsgroup.com but multi-tenant) is its own small Next.js or static site on its own Vercel project. Every button links into referrals.com: `/go?ref=<clone>&url=…` for sign-up and `https://www.referrals.com/signin` for sign-in.

- **Sign-in:** same as option A path 1. Nothing is signed in on the clone, and a handoff token is possible later if wanted.
- **SEO:** same rules. Easier to keep separate because nothing is shared by accident.
- **Database:** none. The site is static, or reads public data from the referrals.com API (`/api/v1`) if it ever needs live numbers.
- **Billing:** links to referrals.com. Prices have to be copied in, or pulled from an API, and can drift.
- **Analytics and attribution:** identical (tracker script with its own `data-domain`, `/go?ref=` links).

**Pros:** fully separate from referrals.com production, so a broken clone can't break the main app. It can live entirely on Cloudflare (VentureOS already builds Workers for these domains), and it's simple to hand to someone else.
**Cons:** a second codebase to maintain. Header, footer, pricing and templates are duplicated or rebuilt. Prices and features drift from the real product. It doesn't feel like the same product as much.

### Why A

You want clones that are really Referrals.com under another name, where people still sign in and manage everything on referrals.com. Option A gives that directly. It reuses the live plan catalog and brand-logo code, and it builds on host routing that already works and is tested. Option B makes more sense if you'd rather keep referrals.com production untouched, or want the clones built and run by VentureOS as Cloudflare ventures. In that case, do one multi-tenant repo for all clones, not one repo per domain.

---

## 3. What each clone needs

### Brand config (one entry per clone)

A new file, for example `src/lib/network-sites.ts`. Rough shape:

```ts
export type NetworkSite = {
  key: string;            // "referrals-net" — route segment
  domain: string;         // "referrals.net" (www. handled automatically)
  name: string;           // "Referrals.net"
  logo: string;           // https://www.brandidentity.com/logo/referrals.net
  colors: { primary: string; accent: string; ink: string };
  tagline: string;        // one line under the logo
  audience: string;       // who this clone talks to, e.g. "agencies", "local businesses"
  hero: { headline: string; sub: string; cta: string };
  pages: Array<"home" | "how-it-works" | "pricing" | "features" | "for">;
  forIndustry?: string;   // vertical clones: which /referral-program-for/<x> angle
  enabled: boolean;       // proxy only serves the clone when true
};
```

- **Logo:** `brandIdentityLogo(domain)` from `src/lib/domain-brand.ts` already builds the brandidentity.com URL, with `<BrandLogo>` as a fallback.
- **Colors and starter copy:** `resolveDomainBrand(domain, { crawl: true })` pulls name, tagline, description and colors from VNOC and the current site, which gives a first draft. The final copy should be written for each clone so it's unique.
- **Copy:** headline, sub-headline, 3 benefit blocks, a short FAQ and one audience angle, about 300 to 600 words of original text per clone.

### Public pages per clone (first version)

| Page | Content |
|---|---|
| `/` | Hero, how it works in 3 steps, benefits, pricing summary, FAQ, "Get started" |
| `/how-it-works` | Clone's own wording of the referral flow |
| `/pricing` | Live plans from `plan-catalog.ts`, buttons go to referrals.com |
| `/features` (optional) | Feature list for the clone's audience |
| `/privacy`, `/terms` | Redirect to referrals.com (same company, same terms) |

Not on clones: blog, forum, knowledgebase, developer docs, campaign pages (`/p/`, `/campaign/`), widget, dashboard. Those either stay on referrals.com or belong to brand white-label domains.

Footer on every clone: "Referrals.net is part of the Referrals.com network. Accounts, billing and support are on Referrals.com." That's honest, and it explains the jump at sign-in.

Ask before go-live: many of these domains currently serve an eCorp Smart Entity page with the `ecorp-smart-entity/2.0` agent card. Decide whether the clone keeps serving that card so the domain stays visible to the eCorp network.

### Adding a new clone (target: config only)

1. Add an entry to `network-sites.ts` with `enabled: false` and write the copy.
2. Deploy (on your command, as usual).
3. Add the domain (apex + www) to the `referrals-next` Vercel project (team vnoc). Remove it first from any stale Vercel project it's attached to.
4. In Cloudflare: remove the Worker route or custom domain (VentureOS `unbind_domain_worker`), then point DNS at Vercel (A `76.76.21.21` for the apex, CNAME `cname.vercel-dns.com` for www, DNS-only/grey cloud so Vercel can issue the certificate).
5. Mark the domain as custom in VNOC (`set_venture_repo`, preview then confirm) so VNOC builders don't overwrite it.
6. Flip `enabled: true`, deploy, and check: home loads, canonical, robots/sitemap, analytics hit, and "Get started" lands on referrals.com/signup with `rref` set.
7. Rollback: set `enabled: false` and rebind the original Worker.

If the list grows past roughly 10 to 15 clones, move the config into a database table with an admin screen, so adding one doesn't need a deploy.

---

## 4. Risks and open questions

### Risks

1. **SEO / link-scheme penalty.** Many look-alike sites linking to referrals.com could drag down its ranking, which matters most (308k uniques/month). Mitigation: unique copy, few links, no shared blog, start with 2 pilots and watch Search Console.
2. **Losing what the domains do today.** Sale landers collect buy/partner inquiries (referral.com 383 leads/30d, referrals.net 13, referralsystem.com 15, referralguru.com 17). A clone replaces that. Option: keep a small "This domain is part of the Referrals.com network — inquire" link in the footer.
3. **Live ventures overwritten.** referralbots.com and referralboard.com are active products. Some Smart Entity pages may be wired into eCorp/VentureOS flows. Exclude these unless you decide otherwise.
4. **Production blast radius (option A).** A bug in the new `proxy.ts` branch could affect referrals.com. Mitigation: the clone check runs only for hosts in the config, with unit tests in `src/proxy.test.ts`, and nothing changes for app hosts.
5. **User confusion at the jump to referrals.com.** Someone signs up "on Referrals.net" and lands on Referrals.com. Mitigation: footer explanation plus co-branded sign-in ("Continue from Referrals.net").
6. **Attribution leak.** If a clone links to its own `/go/` instead of referrals.com's, the credit cookie lands on the wrong domain and sign-ups go uncredited. Mitigation: one shared link helper for all clone CTAs.
7. **Domain hygiene.** referralpad.com looks expired, referralsnet.com has no DNS, and many domains have stale Vercel attachments on other projects. Each needs cleaning up before it can be added to `referrals-next`.
8. **Traffic numbers may be inflated.** The pageview-to-visitor ratios suggest bots, so real human demand for each clone is unknown until the pilots run.

### Questions for you

1. **Option A or B?** (Recommended: A.)
2. **Which 2 pilots?** Suggested: **referrals.net** (closest name to referrals.com, most unique visitors among candidates, sale lander only) and **referralprogram.com** (exact-match search term, sale lander only). Alternatives: referralsystem.com, referralhq.com.
3. **Is referral.com for sale or a clone?** Leave it as is for now?
4. **Keep the "for sale / partner" inquiry** somewhere on clone domains?
5. **Do clones need their own signed-in pages ever?** If not, we never build the handoff token.
6. **Positioning per clone:** same product with a different tone, or a different audience for each (agencies, local businesses, e-commerce, B2B)? Different audiences make unique copy easier and lower SEO risk.
7. **Smart Entity agent card:** keep serving it on clone domains?
8. **Reward for clone sign-ups:** clone sign-ups are credited to a house participant (`<clone>@network.referrals.com`). Should that only be for reporting, with no ADAO or other reward issued? The Google/Facebook sign-up path currently creates an ADAO `participants_rewards` row for any referrer.
9. **Vertical clones later** (doctorsreferral.com, homereferral.net, referagent.com…): yes or no, and which first?

---

## 5. Phased build plan

| Phase | What | Rough effort | Needs your OK for |
|---|---|---|---|
| 0. Decide | Answer the questions above, pick 2 pilots | — | Everything below |
| 1. Foundation | `network-sites.ts` config; new clone branch in `proxy.ts` (rewrites, redirects to referrals.com, robots/sitemap) plus tests; `(network)` route group with its own layout (per-clone metadata/canonical, analytics `data-domain`, header/footer, no `SessionProvider`); a shared CTA link helper using `/go?ref=&url=`; local testing via `*.localhost` host override | 1.5–2 days | Merge and deploy (no domain switched yet, all clones `enabled: false`) |
| 2. Pilot content | Copy and colors for 2 pilots; home, how-it-works, pricing pages | 0.5–1 day per clone | Copy review |
| 3. Pilot go-live | For each pilot: clean stale Vercel attachment, add to `referrals-next`, unbind Cloudflare Worker, DNS to Vercel, VNOC mark custom, enable, check end to end (sign-up credited with `utm_campaign=<clone>`) | ~1 hour per domain | Each DNS switch (public change) |
| 4. Co-branded sign-in | referrals.com `/signin` and `/signup` read `via=<clone>` (checked against config) and show "Continue from <clone>" | 0.5 day | Deploy |
| 5. Measure | 2–4 weeks: VNOC Analytics per clone, Search Console, sign-ups per clone (an admin report grouping sign-up-campaign participants by `@network.referrals.com` domain) | Report: 0.5 day | Go/no-go on rollout |
| 6. Roll out | More clones by config (copy is the main work); vertical clones tied to `/referral-program-for/<industry>` | ~2–3 hours per clone | Each batch |
| 7. Optional | Move the config to a database table with an admin screen (if 10–15+ clones); signed handoff token (only if clones get signed-in pages) | 1 day each | Separate decision |

Total to have 2 pilots live: about 3 to 4 working days of build, plus your reviews and the DNS switches.

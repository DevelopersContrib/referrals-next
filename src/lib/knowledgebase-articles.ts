export type KnowledgebaseArticle = {
	slug: string;
	title: string;
	category: string;
	description: string;
	paragraphs: string[];
};

export const knowledgebaseCategories = [
	{
		title: "Getting Started",
		articles: [
			{ title: "Creating your account", slug: "creating-account" },
			{ title: "Adding your first brand", slug: "adding-brand" },
			{ title: "Setting up your first campaign", slug: "first-campaign" },
			{ title: "Embedding the referral widget", slug: "embedding-widget" },
		],
	},
	{
		title: "Campaigns",
		articles: [
			{ title: "Campaign types explained", slug: "campaign-types" },
			{ title: "Using campaign templates", slug: "campaign-templates" },
			{ title: "Contests and voting campaigns", slug: "contests-and-voting" },
			{ title: "Two-way rewards", slug: "two-way-rewards" },
			{ title: "Setting goals (visits vs signups)", slug: "goals" },
			{ title: "Configuring rewards", slug: "rewards" },
			{ title: "Managing coupons", slug: "coupons" },
			{ title: "Social sharing setup", slug: "social-sharing" },
		],
	},
	{
		title: "Widgets & Embedding",
		articles: [
			{ title: "Widget embed code", slug: "embed-code" },
			{ title: "Widget modes (inline, popup, floating)", slug: "widget-modes" },
			{ title: "Customizing widget appearance", slug: "widget-customization" },
			{ title: "Widget on Shopify stores", slug: "shopify-widget" },
		],
	},
	{
		title: "Billing & Plans",
		articles: [
			{ title: "Understanding plans", slug: "plans" },
			{ title: "PayPal subscription management", slug: "paypal" },
			{ title: "Upgrading your plan", slug: "upgrading" },
			{ title: "Cancellation and refunds", slug: "cancellation" },
		],
	},
	{
		title: "Integrations",
		articles: [
			{ title: "MailChimp integration", slug: "mailchimp" },
			{ title: "Shopify integration", slug: "shopify" },
			{ title: "Zapier automation", slug: "zapier" },
			{ title: "Using the REST API", slug: "rest-api" },
			{ title: "Setting up webhooks", slug: "webhooks" },
		],
	},
	{
		title: "Analytics & Tracking",
		articles: [
			{ title: "Understanding your dashboard stats", slug: "dashboard-stats" },
			{ title: "Click and share tracking", slug: "tracking" },
			{ title: "Exporting participant data", slug: "exporting" },
			{ title: "Share link tracking (/t/ URLs)", slug: "share-links" },
		],
	},
	{
		title: "Whitelabel & Branding",
		articles: [
			{ title: "Custom domains", slug: "custom-domains" },
			{ title: "Brand subdomains", slug: "brand-subdomains" },
			{ title: "Branded email templates", slug: "branded-emails" },
		],
	},
];

export const knowledgebaseArticles: KnowledgebaseArticle[] = [
	{
		slug: "creating-account",
		title: "Creating your account",
		category: "Getting Started",
		description: "How to sign up for Referrals.com and get started.",
		paragraphs: [
			"Visit referrals.com/signup to create your free account. You'll need your name, email address, and a password. During signup you can also enter your first brand's website URL — Referrals.com will fetch your logo and site details automatically.",
			"After confirming your email, sign in at /signin to access your dashboard. From there you can add additional brands, create campaigns, and configure your referral widget.",
			"Your account gives you access to all core features including campaign management, participant tracking, and embeddable widgets. Paid plans unlock higher limits on brands, participants, and advanced tools.",
		],
	},
	{
		slug: "adding-brand",
		title: "Adding your first brand",
		category: "Getting Started",
		description: "Add a brand by entering your website URL.",
		paragraphs: [
			"From your dashboard, click Create Brand or go to /brands/new. Enter your website URL (e.g. https://yoursite.com). Referrals.com validates the domain and pulls in your site title and logo.",
			"Each brand represents one website or business. You can manage multiple brands from a single account — useful if you run several sites or client accounts.",
			"Once your brand is created, open its dashboard at /brands/[id] to view stats, manage campaigns, and access the widget editor.",
		],
	},
	{
		slug: "first-campaign",
		title: "Setting up your first campaign",
		category: "Getting Started",
		description: "Create your first referral campaign step by step.",
		paragraphs: [
			"Navigate to your brand dashboard and click Create Campaign. The campaign wizard walks you through choosing a campaign type, naming your campaign, and setting referral goals.",
			"Goals determine when participants earn rewards — for example, when a referred friend visits your site (visits) or completes a signup form (signups). You can adjust goals later from the campaign settings.",
			"After creating the campaign, configure rewards and customize your widget before embedding it on your site. Published campaigns appear in your brand's campaign list immediately.",
		],
	},
	{
		slug: "embedding-widget",
		title: "Embedding the referral widget",
		category: "Getting Started",
		description: "Add the referral widget to your website.",
		paragraphs: [
			"Open your campaign and go to the Integration or Widget panel. Copy the one-line embed code provided — it's a simple script tag you paste before the closing </body> tag on your site.",
			"The widget loads asynchronously and won't slow down your page. Choose between inline embed (widget appears in-page) or popup mode (widget opens in a modal).",
			"After embedding, visit your site to confirm the widget appears. Impressions are tracked automatically and visible in your dashboard stats.",
		],
	},
	{
		slug: "campaign-types",
		title: "Campaign types explained",
		category: "Campaigns",
		description: "Overview of referral campaign types on Referrals.com.",
		paragraphs: [
			"Referrals.com supports several campaign types designed for different referral mechanics — standard referral programs, contests, and two-way reward campaigns where both referrer and referee benefit.",
			"When creating a campaign, the wizard presents available types based on your plan. Each type configures default widget templates and reward flows suited to that mechanic.",
			"Choose the type that matches your goal: a simple refer-a-friend program for steady growth, or a contest type for time-limited viral campaigns.",
		],
	},
	{
		slug: "goals",
		title: "Setting goals (visits vs signups)",
		category: "Campaigns",
		description: "Configure visit and signup goals for your campaign.",
		paragraphs: [
			"Campaign goals define the action a referred person must take before the referrer earns a reward. Visit goals count when someone clicks a share link and lands on your site. Signup goals require the referred person to register or submit a form.",
			"Set your goal type in the campaign wizard or edit page. Visit goals are easier to achieve and drive traffic; signup goals produce higher-quality leads but convert at lower rates.",
			"You can set numeric thresholds (e.g. 3 visits or 1 signup) depending on campaign type. Monitor conversion rates in your stats to find the right balance.",
		],
	},
	{
		slug: "rewards",
		title: "Configuring rewards",
		category: "Campaigns",
		description: "Set up rewards participants earn for successful referrals.",
		paragraphs: [
			"Rewards are configured per campaign at /brands/[brandId]/campaigns/[campaignId]/rewards. Options include coupon codes, custom email messages, redirect URLs, and cash-equivalent rewards depending on your plan.",
			"When a participant hits your campaign goal, Referrals.com can automatically send the reward via email. Customize the reward notification subject and message to match your brand voice.",
			"For two-way campaigns, configure separate rewards for the referrer and the person they invited. Both parties receive notifications when goals are met.",
		],
	},
	{
		slug: "coupons",
		title: "Managing coupons",
		category: "Campaigns",
		description: "Create and distribute coupon codes as referral rewards.",
		paragraphs: [
			"Coupon rewards let you offer discount codes when participants refer others. Upload or generate coupon codes in the campaign rewards section.",
			"Each coupon can have a unique code, expiration date, and usage limit. Referrals.com distributes codes automatically as participants earn rewards, preventing duplicate assignments.",
			"Track coupon redemptions through your e-commerce platform or the /coupon landing page, which validates codes shared via referral links.",
		],
	},
	{
		slug: "social-sharing",
		title: "Social sharing setup",
		category: "Campaigns",
		description: "Enable social sharing for your referral campaigns.",
		paragraphs: [
			"The referral widget includes built-in share buttons for email, Facebook, Twitter/X, and copy-link. Participants can share their unique referral link with one click.",
			"Each share generates a tracked link (/t/ URL) that attributes clicks and conversions back to the participant. Customize the default share message in the widget editor.",
			"For Facebook-specific campaigns, use the Facebook tool at /tools/facebook to configure Open Graph metadata and track social referrals separately.",
		],
	},
	{
		slug: "campaign-templates",
		title: "Using campaign templates",
		category: "Campaigns",
		description: "Start quickly with pre-built campaign templates.",
		paragraphs: [
			"Referrals.com offers pre-built templates for common referral mechanics — social rewards, invite-a-friend, token giveaways, photo voting, polls, and more. Browse templates at /campaign-templates.",
			"When creating a campaign, choose a template to pre-fill widget layout, default copy, and reward settings. You can customize every element before publishing.",
			"Templates marked Premium require a paid plan. Free templates include social reward and basic invite flows suitable for most small businesses.",
		],
	},
	{
		slug: "contests-and-voting",
		title: "Contests and voting campaigns",
		category: "Campaigns",
		description: "Run contests, polls, and voting to drive engagement.",
		paragraphs: [
			"Contest and voting campaign types let participants compete for rewards based on referrals, votes, or poll responses. These mechanics create urgency and social proof.",
			"Photo voting campaigns allow participants to submit entries and invite friends to vote. Poll campaigns collect opinions while tracking who referred each respondent.",
			"Configure contest end dates, winner selection rules, and prize tiers in the campaign wizard. Leaderboards in the widget show top performers in real time.",
		],
	},
	{
		slug: "two-way-rewards",
		title: "Two-way rewards",
		category: "Campaigns",
		description: "Reward both the referrer and the person they invite.",
		paragraphs: [
			"Two-way reward campaigns give incentives to both parties — the person who shares and the friend who signs up or visits. This increases conversion rates compared to referrer-only rewards.",
			"Configure separate rewards for each side in the campaign rewards panel. Common setups include a discount for the referee and a larger coupon or cash reward for the referrer.",
			"Both parties receive email notifications when goals are met. Customize each message to explain what the recipient earned and how to redeem their reward.",
		],
	},
	{
		slug: "embed-code",
		title: "Widget embed code",
		category: "Widgets & Embedding",
		description: "How to use the widget embed code on your site.",
		paragraphs: [
			"The embed code is a single <script> tag unique to your campaign. Find it in the campaign Integration panel or Widget editor.",
			"Paste the script before </body> on any page where you want the widget to appear. For site-wide deployment, add it to your theme's footer template.",
			"The script is lightweight and loads the widget asynchronously. No additional dependencies or API keys are required for basic embedding.",
		],
	},
	{
		slug: "widget-modes",
		title: "Widget modes (inline, popup, floating)",
		category: "Widgets & Embedding",
		description: "Choose how the referral widget appears on your site.",
		paragraphs: [
			"Referrals.com widgets support embed mode (inline in your page content) and popup mode (opens in a modal overlay). Select the placement in the widget editor under Template Settings.",
			"Embed mode works well in dedicated landing pages or sidebars. Popup mode is ideal for minimal intrusion — visitors see a trigger button and the widget opens on click.",
			"Preview both modes in the widget editor before publishing. You can switch modes at any time without changing the embed code.",
		],
	},
	{
		slug: "widget-customization",
		title: "Customizing widget appearance",
		category: "Widgets & Embedding",
		description: "Match the widget to your brand colors and style.",
		paragraphs: [
			"The widget editor at /brands/[brandId]/campaigns/[campaignId]/widget lets you customize colors, fonts, images, button text, and layout. Changes preview in real time.",
			"Upload a background image or choose a solid color. Set primary and accent colors to match your brand palette. The editor supports custom CSS for advanced styling on paid plans.",
			"Save your template to reuse across campaigns. Widget templates are stored per campaign and can be duplicated when creating new campaigns.",
		],
	},
	{
		slug: "shopify-widget",
		title: "Widget on Shopify stores",
		category: "Widgets & Embedding",
		description: "Embed referral widgets on Shopify.",
		paragraphs: [
			"For Shopify stores, use the Shopify integration at /integrations/shopify to connect your store and simplify widget installation.",
			"Alternatively, paste the standard embed code into your theme's theme.liquid file before </body>, or use a Custom HTML section on specific pages.",
			"The widget works on all Shopify plans. Track referral performance alongside your store analytics in the Referrals.com dashboard.",
		],
	},
	{
		slug: "plans",
		title: "Understanding plans",
		category: "Billing & Plans",
		description: "Overview of Referrals.com pricing plans.",
		paragraphs: [
			"Referrals.com offers tiered plans based on the number of brands, participants per campaign, and feature access. View current plans and pricing at /billing.",
			"Free accounts can create brands and run basic campaigns with participant limits. Paid plans increase limits and unlock integrations, API access, and advanced widget customization.",
			"Each plan lists included brands, participant caps, and billing period (monthly or annual). Compare plans on the billing page before subscribing.",
		],
	},
	{
		slug: "paypal",
		title: "PayPal subscription management",
		category: "Billing & Plans",
		description: "Manage your PayPal subscription for Referrals.com.",
		paragraphs: [
			"Paid subscriptions are processed through PayPal. When you subscribe, you're redirected to PayPal to approve a billing agreement. Your agreement ID is stored securely and shown on the billing page.",
			"PayPal handles recurring charges automatically each billing period. Payment history appears in your Referrals.com billing page and in your PayPal account activity.",
			"If a payment fails, PayPal retries according to its policies. You'll receive email notification and can update your PayPal funding source to restore access.",
		],
	},
	{
		slug: "upgrading",
		title: "Upgrading your plan",
		category: "Billing & Plans",
		description: "How to upgrade or switch plans.",
		paragraphs: [
			"Go to /billing and click Switch Plan on any higher tier. You'll be guided through PayPal to approve the new subscription rate.",
			"Upgrades take effect immediately. Your new plan limits (brands, participants) apply right away. Billing is prorated through PayPal for the current period.",
			"If you hit participant or brand limits, the dashboard will prompt you to upgrade. You can also upgrade proactively before reaching limits.",
		],
	},
	{
		slug: "cancellation",
		title: "Cancellation and refunds",
		category: "Billing & Plans",
		description: "How to cancel your subscription.",
		paragraphs: [
			"Cancel your subscription from /billing using the Cancel Subscription button. You'll keep access until the end of your current billing period.",
			"Cancellation calls the PayPal API to suspend your billing agreement. You can reactivate before your plan expires if you change your mind.",
			"Refund requests are handled case-by-case. Contact support at /contact with your transaction ID for billing inquiries.",
		],
	},
	{
		slug: "mailchimp",
		title: "MailChimp integration",
		category: "Integrations",
		description: "Connect MailChimp to sync referral participants.",
		paragraphs: [
			"Connect your MailChimp account at /integrations/mailchimp. Authorize Referrals.com to access your audience lists.",
			"When participants join a campaign, their email and name can sync to a selected MailChimp list automatically. Map fields in the integration settings.",
			"Use MailChimp automations to send welcome sequences, reward notifications, or nurture campaigns to your referral participants.",
		],
	},
	{
		slug: "shopify",
		title: "Shopify integration",
		category: "Integrations",
		description: "Connect your Shopify store to Referrals.com.",
		paragraphs: [
			"The Shopify integration at /integrations/shopify connects your store for simplified widget installation and order attribution.",
			"Install the connection by entering your Shopify store URL and following the authorization flow. Once connected, embed widgets using the guided setup.",
			"Track how referral traffic converts to Shopify orders by combining Referrals.com click data with your Shopify analytics.",
		],
	},
	{
		slug: "zapier",
		title: "Zapier automation",
		category: "Integrations",
		description: "Automate workflows with Zapier.",
		paragraphs: [
			"Use the Referrals.com REST API with Zapier to trigger automations when participants join, share, or earn rewards.",
			"Common Zaps include adding participants to CRM systems, sending Slack notifications on new referrals, and updating spreadsheets.",
			"Generate an API key at /api-keys and use it to authenticate Zapier webhook actions against the /api/v1 endpoints.",
		],
	},
	{
		slug: "rest-api",
		title: "Using the REST API",
		category: "Integrations",
		description: "Programmatic access to Referrals.com data.",
		paragraphs: [
			"The REST API at /api/v1 provides endpoints for brands, campaigns, participants, and stats. Full documentation is available at /developer/docs.",
			"Authenticate with an API key passed in the X-API-Key header. Create keys at /api-keys in your dashboard.",
			"Use the API playground at /developer/playground to test endpoints interactively before integrating into your application.",
		],
	},
	{
		slug: "webhooks",
		title: "Setting up webhooks",
		category: "Integrations",
		description: "Receive real-time event notifications.",
		paragraphs: [
			"Webhooks notify your server when events occur — new participants, shares, reward triggers, and more. Configure webhook URLs in your API settings.",
			"Each webhook payload includes event type, timestamp, and relevant data (participant ID, campaign ID, etc.). Verify payloads using your API key.",
			"Use webhooks to sync data to your CRM, trigger fulfillment systems, or build custom analytics pipelines alongside the dashboard.",
		],
	},
	{
		slug: "dashboard-stats",
		title: "Understanding your dashboard stats",
		category: "Analytics & Tracking",
		description: "Read your referral performance metrics.",
		paragraphs: [
			"The main dashboard at /dashboard shows a summary of all your brands and campaigns. The Stats page at /stats provides aggregate metrics: participants, shares, clicks, impressions, and rewards.",
			"Each brand has its own stats page with time-series charts for participants and shares. Use date range filters to analyze specific periods.",
			"Per-campaign breakdown tables show which campaigns drive the most engagement. Click a campaign name to open its detail page.",
		],
	},
	{
		slug: "tracking",
		title: "Click and share tracking",
		category: "Analytics & Tracking",
		description: "How referral clicks and shares are tracked.",
		paragraphs: [
			"When a participant shares their referral link, Referrals.com records a share event. When someone clicks that link, a click is attributed to the participant and campaign.",
			"Clicks are counted in the participants_share table and aggregated in your stats. Unique visitors and repeat clicks are both tracked for analytics.",
			"Goal completions (visits or signups) are tracked separately. A participant earns a reward when their referrals meet the configured goal threshold.",
		],
	},
	{
		slug: "exporting",
		title: "Exporting participant data",
		category: "Analytics & Tracking",
		description: "Export your participant and referral data.",
		paragraphs: [
			"Export participant data as CSV from the Contacts page at /contacts or from individual campaign participant lists.",
			"Brand exports are available at /api/brands/export for a full dump of your brand configuration. Participant exports include email, name, signup date, and referral counts.",
			"Use exported data for custom reward fulfillment, CRM imports, or offline analysis in spreadsheet tools.",
		],
	},
	{
		slug: "share-links",
		title: "Share link tracking (/t/ URLs)",
		category: "Analytics & Tracking",
		description: "How /t/ tracking URLs work.",
		paragraphs: [
			"Every participant receives a unique tracking URL in the format yoursite.com/t/[code]. This short link redirects to your campaign landing page while recording the click.",
			"The /t/ route attributes the visit to the correct participant and campaign. Multiple clicks from the same visitor are counted for analytics but goal completion logic may deduplicate by session.",
			"Participants copy their tracking link from the widget. You can also retrieve share links via the API for custom distribution channels.",
		],
	},
	{
		slug: "custom-domains",
		title: "Custom domains",
		category: "Whitelabel & Branding",
		description: "Use your own domain for referral landing pages.",
		paragraphs: [
			"Enterprise and whitelabel plans support custom domains for brand pages and campaign landers. Instead of referrals.com/p/yourbrand, visitors see yourbrand.com or referrals.yourbrand.com.",
			"To set up a custom domain, add a CNAME record pointing to proxy.referrals.com in your DNS provider. Then contact support or use the subdomain settings page to request verification.",
			"Once verified, SSL is provisioned automatically. Custom domains apply to public brand pages, campaign landers, and share link redirects.",
		],
	},
	{
		slug: "brand-subdomains",
		title: "Brand subdomains",
		category: "Whitelabel & Branding",
		description: "Host referral pages on a referrals.com subdomain.",
		paragraphs: [
			"Each brand can use a branded subdomain such as yourbrand.referrals.com for public pages and campaign landers. Configure this in your brand settings under Subdomain.",
			"Subdomains are available on Premium and Enterprise plans. Choose a unique slug that matches your brand name — it must be available and follow naming guidelines.",
			"Subdomain pages inherit your brand logo, colors, and widget styling. Share links can use the subdomain for a more professional appearance than the default /p/ path.",
		],
	},
	{
		slug: "branded-emails",
		title: "Branded email templates",
		category: "Whitelabel & Branding",
		description: "Customize reward and notification emails to match your brand.",
		paragraphs: [
			"Referrals.com sends transactional emails for reward notifications, invite confirmations, and campaign updates. Customize subject lines and body copy per campaign in the rewards settings.",
			"Whitelabel plans allow custom sender names and reply-to addresses. Enterprise plans support fully custom email templates with your logo, colors, and footer links.",
			"Preview email content in the campaign editor before publishing. Test sends go to your account email so you can verify formatting across clients.",
		],
	},
];

const articleMap = new Map(
	knowledgebaseArticles.map((a) => [a.slug, a])
);

export function getArticleBySlug(slug: string): KnowledgebaseArticle | undefined {
	return articleMap.get(slug);
}

export function getRelatedArticles(
	slug: string,
	limit = 4
): KnowledgebaseArticle[] {
	const article = articleMap.get(slug);
	if (!article) return [];
	return knowledgebaseArticles
		.filter((a) => a.category === article.category && a.slug !== slug)
		.slice(0, limit);
}

export function getAllArticleSlugs(): string[] {
	return knowledgebaseArticles.map((a) => a.slug);
}

function articleSearchText(article: KnowledgebaseArticle): string {
	return [
		article.title,
		article.category,
		article.description,
		...article.paragraphs,
	]
		.join(" ")
		.toLowerCase();
}

export function searchArticles(query: string): KnowledgebaseArticle[] {
	const q = query.trim().toLowerCase();
	if (!q) return knowledgebaseArticles;
	return knowledgebaseArticles.filter((article) =>
		articleSearchText(article).includes(q)
	);
}

export type KnowledgebaseCategory = (typeof knowledgebaseCategories)[number];

export function filterCategoriesBySlugs(
	slugs: Set<string>
): KnowledgebaseCategory[] {
	return knowledgebaseCategories
		.map((cat) => ({
			...cat,
			articles: cat.articles.filter((a) => slugs.has(a.slug)),
		}))
		.filter((cat) => cat.articles.length > 0);
}

/** Allowlisted help URLs for the support AI agent. */
export function helpArticlesCatalogForAi(): string {
	const base = (
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXTAUTH_URL ||
		"https://www.referrals.com"
	).replace(/\/$/, "");
	return knowledgebaseArticles
		.map((a) => `- ${a.title}: ${base}/support/${a.slug}`)
		.join("\n");
}

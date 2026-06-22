import { Metadata } from "next";
import Link from "next/link";
import { WalkthroughStepImage } from "@/components/public/walkthrough-step-image";

export const metadata: Metadata = {
	title: "Platform Walkthrough",
	description:
		"Step-by-step guide to setting up your first referral campaign on Referrals.com.",
	openGraph: {
		title: "Platform Walkthrough | Referrals.com",
		description:
			"Step-by-step guide to setting up your first referral campaign on Referrals.com.",
		url: "https://referrals.com/walkthrough",
		siteName: "Referrals.com",
		images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
		type: "website",
	},
	twitter: {
		card: "summary",
		title: "Platform Walkthrough | Referrals.com",
		description:
			"Step-by-step guide to setting up your first referral campaign on Referrals.com.",
	},
};

const walkthroughSteps = [
	{
		step: 1,
		title: "Create Your Account",
		description:
			"Sign up for a free account at Referrals.com. You will need your name, email, and the website URL for your first brand.",
		image: "/images/walkthrough/step-01-signup.png",
	},
	{
		step: 2,
		title: "Add Your Brand",
		description:
			"After signing up, add your brand by entering your website URL. We will automatically fetch your site details and logo. You can manage multiple brands from one account.",
		image: "/images/walkthrough/step-02-brand.png",
	},
	{
		step: 3,
		title: "Create a Campaign",
		description:
			"Navigate to your brand and click Create Campaign. Choose your campaign type, set a name, and configure your referral goals (visits, signups, or shares).",
		image: "/images/walkthrough/step-03-campaign.png",
	},
	{
		step: 4,
		title: "Customize Your Widget",
		description:
			"Pick a widget template and customize it with your brand colors, images, and copy. Preview it in real time. Choose between an embed widget or a popup.",
		image: "/images/walkthrough/step-04-widget.png",
	},
	{
		step: 5,
		title: "Set Up Rewards",
		description:
			"Define what participants earn when they refer others. Options include coupon codes, custom messages, redirect URLs, or cash rewards.",
		image: "/images/walkthrough/step-05-rewards.png",
	},
	{
		step: 6,
		title: "Embed on Your Site",
		description:
			"Copy the one-line embed code and paste it into your website. The widget will appear immediately and start collecting referrals.",
		image: "/images/walkthrough/step-06-embed.png",
	},
	{
		step: 7,
		title: "Monitor Your Dashboard",
		description:
			"Track participants, shares, clicks, and conversions in real time from your dashboard. Use the analytics to optimize your campaign.",
		image: "/images/walkthrough/step-07-dashboard.png",
	},
	{
		step: 8,
		title: "Reward Your Referrers",
		description:
			"Rewards are distributed automatically when participants hit your goals. You can also manually trigger rewards or export participant data for custom fulfillment.",
		image: "/images/walkthrough/step-08-reward.png",
	},
];

export default function WalkthroughPage() {
	return (
		<div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="text-center">
				<h1 className="text-4xl font-bold tracking-tight text-gray-900">
					Platform Walkthrough
				</h1>
				<p className="mt-4 text-lg text-gray-600">
					Follow these steps to set up your first referral campaign from start
					to finish.
				</p>
			</div>

			<div className="mt-12 space-y-16">
				{walkthroughSteps.map((item) => (
					<div
						key={item.step}
						className="flex flex-col gap-6 lg:gap-8 lg:items-center lg:flex-row even:lg:flex-row-reverse"
					>
						<div className="flex-1">
							<WalkthroughStepImage
								src={item.image}
								alt={`${item.title} screenshot`}
								step={item.step}
							/>
						</div>
						<div className="flex flex-1 gap-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
								{item.step}
							</div>
							<div>
								<h2 className="text-lg font-semibold text-gray-900">
									{item.title}
								</h2>
								<p className="mt-2 text-gray-600">{item.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="mt-16 text-center">
				<p className="text-gray-600">Ready to get started?</p>
				<Link
					href="/signup"
					className="mt-4 inline-block min-h-11 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-white hover:bg-brand-hover"
				>
					Try it now — Create Your Account
				</Link>
			</div>
		</div>
	);
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Referrals.com account to manage your referral campaigns.",
  openGraph: {
    title: "Sign In | Referrals.com",
    description:
      "Sign in to your Referrals.com account to manage your referral campaigns.",
    url: "https://referrals.com/signin",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign In | Referrals.com",
    description:
      "Sign in to your Referrals.com account to manage your referral campaigns.",
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

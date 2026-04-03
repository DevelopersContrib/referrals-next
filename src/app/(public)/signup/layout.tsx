import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Start Free",
  description:
    "Create your free Referrals.com account and launch your first referral campaign in minutes.",
  openGraph: {
    title: "Sign Up — Start Free | Referrals.com",
    description:
      "Create your free Referrals.com account and launch your first referral campaign in minutes.",
    url: "https://referrals.com/signup",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign Up — Start Free | Referrals.com",
    description:
      "Create your free Referrals.com account and launch your first referral campaign in minutes.",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

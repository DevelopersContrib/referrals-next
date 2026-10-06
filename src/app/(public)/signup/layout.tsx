import type { Metadata } from "next";

export const metadata: Metadata = {
  // No `title`: a plain title string in a layout stops the root
  // "%s | Referrals.com" template from reaching nested routes. Pages set theirs.
  description:
    "Create your Referrals.com account. Set up a brand for free, then pay $9/mo per brand to publish it.",
  openGraph: {
    title: "Create your account | Referrals.com",
    description:
      "Set up a brand for free. Pay $9/mo per brand to publish it and accept signups.",
    url: "https://referrals.com/signup",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Create your account | Referrals.com",
    description:
      "Set up a brand for free. Pay $9/mo per brand to publish it and accept signups.",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

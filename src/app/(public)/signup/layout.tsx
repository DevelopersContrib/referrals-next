import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — 14-day Growth trial",
  description:
    "Create your Referrals.com account. 14-day Growth trial with no credit card — then $9/mo per brand. VNOC / network domains stay free.",
  openGraph: {
    title: "Sign Up — 14-day Growth trial | Referrals.com",
    description:
      "14-day Growth trial, no credit card. Then $9/mo per brand. VNOC / network domains stay free.",
    url: "https://referrals.com/signup",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign Up — 14-day Growth trial | Referrals.com",
    description:
      "14-day Growth trial, no credit card. Then $9/mo per brand. VNOC / network domains stay free.",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

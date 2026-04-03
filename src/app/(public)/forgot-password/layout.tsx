import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Referrals.com account password.",
  openGraph: {
    title: "Forgot Password | Referrals.com",
    description: "Reset your Referrals.com account password.",
    url: "https://referrals.com/forgot-password",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Forgot Password | Referrals.com",
    description: "Reset your Referrals.com account password.",
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

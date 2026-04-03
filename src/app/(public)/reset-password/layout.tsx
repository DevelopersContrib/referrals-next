import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Referrals.com account.",
  openGraph: {
    title: "Reset Password | Referrals.com",
    description: "Set a new password for your Referrals.com account.",
    url: "https://referrals.com/reset-password",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Reset Password | Referrals.com",
    description: "Set a new password for your Referrals.com account.",
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

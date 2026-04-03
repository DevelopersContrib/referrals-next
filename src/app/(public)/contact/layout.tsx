import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Referrals.com team. We'd love to hear from you.",
  openGraph: {
    title: "Contact Us | Referrals.com",
    description:
      "Get in touch with the Referrals.com team. We'd love to hear from you.",
    url: "https://referrals.com/contact",
    siteName: "Referrals.com",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact Us | Referrals.com",
    description:
      "Get in touch with the Referrals.com team. We'd love to hear from you.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

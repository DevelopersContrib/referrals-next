import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Referrals.com — The Best Referral Marketing Platform",
    template: "%s | Referrals.com",
  },
  description:
    "The best referral marketing platform. Create referral campaigns, track shares, reward participants, and grow your business through word-of-mouth.",
  metadataBase: new URL("https://referrals.com"),
  openGraph: {
    siteName: "Referrals.com",
    type: "website",
    locale: "en_US",
    images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
  },
  twitter: {
    card: "summary",
    site: "@referralscom",
  },
  icons: {
    icon: "/images/logo/logo.png",
    apple: "/images/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

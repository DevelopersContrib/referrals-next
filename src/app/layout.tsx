import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
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
    <html lang="en" className={`${openSans.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Dosis:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" style={{ fontFamily: "'Open Sans', var(--font-open-sans), sans-serif" }}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

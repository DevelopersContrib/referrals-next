import type { Metadata, Viewport } from "next";
import { Open_Sans, Dosis } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const dosis = Dosis({
  variable: "--font-dosis",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff5f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${dosis.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" style={{ fontFamily: "'Open Sans', var(--font-open-sans), sans-serif" }}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

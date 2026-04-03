import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share your feedback, feature requests, and suggestions to help improve Referrals.com.",
  openGraph: { title: "Feedback | Referrals.com", description: "Share your feedback to help improve Referrals.com.", url: "https://referrals.com/feedback" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Send to Friends",
  description:
    "Share Referrals.com with your friends. Send them an invitation to join our referral marketing platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

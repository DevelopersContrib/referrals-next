import type { Metadata } from "next";
import { SignupShare } from "./share-content";

export const metadata: Metadata = {
  title: "Share Your Referral Link",
  description:
    "Share your unique referral link with friends and earn rewards.",
};

export default function SignupSharePage() {
  return <SignupShare />;
}

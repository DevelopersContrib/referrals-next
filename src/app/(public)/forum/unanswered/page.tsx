import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Unanswered Forum Topics",
  description: "Forum topics that still need a reply.",
  alternates: { canonical: siteUrl("/forum/unanswered") },
};

export default function ForumUnansweredPage() {
  redirect("/forum?tab=unanswered");
}

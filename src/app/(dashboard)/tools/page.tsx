import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const tools = [
  {
    title: "Email Campaigns",
    description: "Compose and send emails to your campaign participants.",
    href: "/tools/email",
  },
  {
    title: "Banners",
    description: "Upload and manage promotional banners for your campaigns.",
    href: "/tools/banners",
  },
  {
    title: "Reviews",
    description: "Collect and manage customer reviews for social proof.",
    href: "/tools/reviews",
  },
  {
    title: "Testimonials",
    description: "Showcase customer testimonials on your campaigns.",
    href: "/tools/testimonials",
  },
  {
    title: "Partnerships",
    description: "Manage partnership opportunities and collaborations.",
    href: "/tools/partnerships",
  },
  {
    title: "Ads",
    description: "Create and manage ad campaigns to drive traffic.",
    href: "/tools/ads",
  },
  {
    title: "Promotion",
    description: "Promote your campaigns across channels for maximum reach.",
    href: "/tools/promotion",
  },
  {
    title: "Shoutouts",
    description: "Give and receive shoutouts from the community.",
    href: "/tools/shoutouts",
  },
];

export default async function ToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="mt-1 text-muted-foreground">
          A collection of tools to help you grow your referral campaigns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full hover:border-blue-300 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-blue-600">Open tool &rarr;</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

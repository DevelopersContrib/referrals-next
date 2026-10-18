import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ImageIcon,
  MailIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  Share2Icon,
  StarIcon,
  TargetIcon,
  HandshakeIcon,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tools", robots: { index: false, follow: false } };

type Tool = { title: string; description: string; href: string; icon: LucideIcon; forBrand: boolean };

/** Tools that work on campaigns open filtered to this brand (?brandId=). */
function toolsFor(brandId: number): Tool[] {
  const b = `?brandId=${brandId}`;
  return [
    { title: "Banners", description: "Upload and manage promotional banners for this brand's campaigns.", href: `/tools/banners${b}`, icon: ImageIcon, forBrand: true },
    { title: "Ads", description: "Create ads that drive traffic to this brand's campaigns.", href: `/tools/ads${b}`, icon: TargetIcon, forBrand: true },
    { title: "Promotions", description: "Promote this brand's campaigns across the network.", href: `/promotions${b}`, icon: Share2Icon, forBrand: true },
    { title: "Email", description: "Email your campaign participants.", href: "/tools/email", icon: MailIcon, forBrand: false },
    { title: "Reviews", description: "Collect customer reviews for social proof.", href: "/tools/reviews", icon: StarIcon, forBrand: false },
    { title: "Testimonials", description: "Showcase customer testimonials on your campaigns.", href: "/tools/testimonials", icon: MessageSquareIcon, forBrand: false },
    { title: "Shoutouts", description: "Give and receive shoutouts from the community.", href: "/tools/shoutouts", icon: MegaphoneIcon, forBrand: false },
    { title: "Partnerships", description: "Find other brands to partner with.", href: "/tools/partnerships", icon: HandshakeIcon, forBrand: false },
  ];
}

export default async function BrandToolsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const { brandId: raw } = await params;
  const brandId = parseInt(raw, 10);
  if (Number.isNaN(brandId)) notFound();

  const brand = await prisma.member_urls.findFirst({
    where: { id: brandId, member_id: parseInt(session.user.id, 10) },
    select: { id: true, domain: true },
  });
  if (!brand) notFound();

  const tools = toolsFor(brand.id);
  const integrations = [
    { title: "Mailchimp", description: "Sync participants and automate email marketing.", href: "/integrations/mailchimp" },
    { title: "Facebook", description: "Share campaigns and track social referrals.", href: "/tools/facebook" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tools</h1>
        <p className="mt-1 text-muted-foreground">Grow {brand.domain} with these marketing tools.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Marketing tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                href={t.href}
                className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-[#d63a40]" aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <span className="mt-3 flex items-center gap-2 font-semibold text-gray-900">
                  {t.title}
                  {!t.forBrand && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                      All brands
                    </span>
                  )}
                </span>
                <span className="mt-1 flex-1 text-sm text-gray-600">{t.description}</span>
                <span className="mt-3 text-sm font-medium text-brand group-hover:underline">Open tool →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Integrations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((i) => (
            <Link
              key={i.title}
              href={i.href}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-brand/40"
            >
              <span className="font-semibold text-gray-900">{i.title}</span>
              <span className="mt-1 flex-1 text-sm text-gray-600">{i.description}</span>
              <span className="mt-3 text-sm font-medium text-brand">Configure →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

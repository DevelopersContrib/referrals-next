import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PublicBrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const brand = await prisma.member_urls.findFirst({
    where: { slug },
  });

  if (!brand) notFound();

  const campaigns = await prisma.member_campaigns.findMany({
    where: { url_id: brand.id, publish: "public" },
    orderBy: { date_added: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{brand.domain}</h1>
          {brand.description && (
            <p className="mt-1 text-gray-600">{brand.description}</p>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Active Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-500">No active campaigns at the moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/p/${slug}/campaign/${campaign.id}`}
                className="block rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {campaign.goal_type === "visit"
                    ? `Goal: ${campaign.num_visits} visits`
                    : `Goal: ${campaign.num_signups} signups`}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <footer className="border-t bg-white mt-8 py-4 text-center text-sm text-gray-400">
        Powered by{" "}
        <a href="https://referrals.com" className="text-blue-600 hover:underline">
          Referrals.com
        </a>
      </footer>
    </div>
  );
}

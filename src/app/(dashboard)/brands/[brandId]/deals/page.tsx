import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DealsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { brandId } = await params;
  const brand = await prisma.member_urls.findUnique({
    where: { id: parseInt(brandId, 10) },
  });

  if (!brand || brand.member_id !== parseInt(session.user.id, 10)) {
    redirect("/brands");
  }

  const deals = await prisma.brand_deals.findMany({
    where: { url_id: parseInt(brandId, 10) },
    orderBy: { id: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals — {brand.domain}</h1>
          <p className="text-muted-foreground">Manage promotions and deals for this brand.</p>
        </div>
        <Link
          href={`/brands/${brandId}/deals/new`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No deals yet. Create your first deal to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id}>
              <CardHeader>
                <CardTitle className="text-base">{deal.title || `Deal #${deal.id}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {deal.description || "No description"}
                </p>
                {deal.url && (
                  <p className="text-xs text-blue-600 truncate">{deal.url}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/brands/${brandId}/deals/${deal.id}/edit`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

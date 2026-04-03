import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getAdminStats() {
  const [members, brands, campaigns, participants] = await Promise.all([
    prisma.members.count(),
    prisma.member_urls.count(),
    prisma.member_campaigns.count(),
    prisma.campaign_participants.count(),
  ]);

  return { members, brands, campaigns, participants };
}

export default async function AdminDashboardPage() {
  let stats;
  try {
    stats = await getAdminStats();
  } catch {
    stats = { members: 0, brands: 0, campaigns: 0, participants: 0 };
  }

  const statCards = [
    { title: "Total Members", value: stats.members },
    { title: "Total Brands", value: stats.brands },
    { title: "Total Campaigns", value: stats.campaigns },
    { title: "Total Participants", value: stats.participants },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Platform-wide overview and management.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

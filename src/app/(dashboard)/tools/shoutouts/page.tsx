import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ShoutoutsToolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const shoutouts = await prisma.shoutouts.findMany({
    where: { member_id: memberId },
    orderBy: { date_updated: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shoutouts</h1>
        <p className="mt-1 text-muted-foreground">
          Give and receive shoutouts to build community engagement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Shoutouts</CardTitle>
          <CardDescription>
            Shoutouts you have posted. Pending ones await admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shoutouts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No shoutouts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {shoutouts.map((shoutout) => (
                <div key={shoutout.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={shoutout.approved ? "default" : "secondary"}
                    >
                      {shoutout.approved ? "Approved" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(shoutout.date_updated).toLocaleDateString()}
                    </span>
                  </div>
                  {shoutout.message && (
                    <p className="mt-3 text-sm text-gray-600">
                      {shoutout.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

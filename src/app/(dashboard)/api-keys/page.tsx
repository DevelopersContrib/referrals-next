import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiKeyActions } from "./api-key-actions";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const memberId = parseInt(session.user.id, 10);

  const keys = await prisma.member_keys.findMany({
    where: { userid: memberId },
    orderBy: { date_generated: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your API keys for accessing the Referrals.com REST API.
        </p>
      </div>

      <ApiKeyActions />

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate API requests. Keep them secret.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No API keys generated yet. Click the button above to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.user_key_id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {key.api_key
                        ? `${key.api_key.substring(0, 8)}${"*".repeat(24)}`
                        : "N/A"}
                    </code>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generated{" "}
                      {new Date(key.date_generated).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

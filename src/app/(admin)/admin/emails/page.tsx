import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminEmailLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Email Logs</h1>
        <p className="text-muted-foreground">
          SES delivery logs and email sending history.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Email Delivery Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Sent Today</p>
            </div>
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Bounced</p>
            </div>
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Complaints</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <Badge variant="secondary" className="mb-4 text-sm">
            Coming Soon
          </Badge>
          <h3 className="text-lg font-semibold">
            SES Email Log Integration
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This page will display Amazon SES delivery logs including sent
            emails, bounces, complaints, and delivery status. Connect your SES
            SNS notifications to enable this feature.
          </p>
          <div className="mt-6 space-y-2 text-left mx-auto max-w-md">
            <p className="text-sm font-medium">To enable email logs:</p>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
              <li>Configure SES SNS notifications for bounces, complaints, and deliveries</li>
              <li>Set up a webhook endpoint at /api/webhooks/ses</li>
              <li>Create an email_logs table in the database</li>
              <li>Store and query delivery events from this dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { AdminPagination } from "@/components/admin/admin-pagination";

export default async function AdminEmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; campaign?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const { page: pageParam, campaign } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (campaign) {
    where.campaign_id = parseInt(campaign, 10);
  }

  const [templates, total] = await Promise.all([
    prisma.campaign_email_content.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign_email_content.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">
          {total.toLocaleString()} email templates across all campaigns
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="campaign"
              placeholder="Campaign ID"
              defaultValue={campaign || ""}
              className="max-w-48"
              type="number"
            />
            <Button type="submit">Filter</Button>
            {campaign && (
              <Link href="/admin/email-templates">
                <Button variant="outline">Clear</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Campaign ID</TableHead>
                <TableHead>Template Preview</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {t.subject}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/campaigns/${t.campaign_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{t.campaign_id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                    {t.template
                      ? t.template.replace(/<[^>]*>/g, "").substring(0, 100)
                      : "No template"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/email-templates/${t.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <AdminDeleteButton endpoint={`/api/admin/email-templates/${t.id}`} label="email template" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No email templates found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/email-templates"
        params={{ campaign }}
      />
    </div>
  );
}

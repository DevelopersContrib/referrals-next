import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  DownloadIcon,
  GlobeIcon,
  SettingsIcon,
  LayoutDashboardIcon,
  ChevronRightIcon,
  HomeIcon,
  ExternalLinkIcon,
} from "lucide-react";

export default async function BrandsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const memberId = parseInt(session.user.id, 10);

  const brands = await prisma.member_urls.findMany({
    where: { member_id: memberId },
    orderBy: { date_added: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-brand transition-colors">
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">Brand List</span>
      </nav>

      {/* Subheader */}
      <div className="subheader flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Manage Brands</h1>
          <p className="mt-0.5 text-sm text-white/70">
            {brands.length} brand{brands.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/brands/export">
            <Button className="gap-2 bg-[#28a745] text-white hover:bg-[#218838]">
              <DownloadIcon className="size-4" />
              Export CSV
            </Button>
          </a>
          <Link href="/brands/new">
            <Button className="gap-2 bg-white text-brand hover:bg-white/90 font-semibold">
              <PlusIcon className="size-4" />
              Create Brand
            </Button>
          </Link>
        </div>
      </div>

      {/* Brand Table */}
      <div className="portlet overflow-hidden p-0">
        {brands.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f2f3f8]">
              <GlobeIcon className="size-8 text-[#a7abc3]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#575962]">
              No Brands Yet
            </h3>
            <p className="mt-1 text-sm text-[#a7abc3]">
              Add your first brand to start running referral campaigns.
            </p>
            <Link href="/brands/new" className="mt-4 inline-block">
              <Button className="gap-2 bg-brand text-white hover:bg-brand-hover">
                <PlusIcon className="size-4" />
                Add Your First Brand
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#ebeef0] bg-[#f7f8fa]">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Brand Name
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Website
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Date Added
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Status
                </TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="border-b border-[#ebeef0] transition-colors hover:bg-[#f7f8fa]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.domain}
                          className="size-9 rounded-md border border-[#ebeef0] object-contain p-1"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-md bg-brand/10 text-sm font-bold uppercase text-brand">
                          {brand.domain.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/brands/${brand.id}`}
                          className="font-semibold text-[#575962] hover:text-brand transition-colors"
                        >
                          {brand.domain}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={brand.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#36a3f7] hover:underline"
                    >
                      {brand.url}
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-[#a7abc3]">
                    {new Date(brand.date_added).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {brand.plan_expiry &&
                    new Date(brand.plan_expiry) > new Date() ? (
                      <Badge className="border-0 bg-[#28a745]/10 text-[#28a745] font-medium">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="border-0 bg-[#f2f3f8] text-[#a7abc3] font-medium">
                        Free
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/brands/${brand.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-[#ebeef0] text-[#575962] hover:border-brand hover:text-brand"
                        >
                          <LayoutDashboardIcon className="size-3.5" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href={`/brands/${brand.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-[#a7abc3] hover:text-brand"
                        >
                          <SettingsIcon className="size-3.5" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

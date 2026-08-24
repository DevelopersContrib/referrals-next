import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brands/brand-logo";
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
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-brand transition-colors"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">Brand List</span>
      </nav>

      {/* Subheader */}
      <div className="subheader flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Manage Brands</h1>
          <p className="mt-0.5 text-sm text-white/70">
            {brands.length} brand{brands.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:flex-wrap lg:w-auto">
          {/* CSV download from an API route — not a page, so a plain anchor is correct. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/brands/export" className="w-full sm:w-auto">
            <Button className="min-h-11 w-full gap-2 bg-[#28a745] text-white hover:bg-[#218838] sm:w-auto">
              <DownloadIcon className="size-4" />
              Export CSV
            </Button>
          </a>
          <Link href="/brands/bulk" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="min-h-11 w-full gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
            >
              <DownloadIcon className="size-4" />
              Bulk Import
            </Button>
          </Link>
          <Link href="/brands/new" className="w-full sm:w-auto">
            <Button className="min-h-11 w-full gap-2 bg-white font-semibold text-brand hover:bg-white/90 sm:w-auto">
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
                <TableHead className="hidden text-[11px] font-bold uppercase tracking-wider text-[#a7abc3] lg:table-cell">
                  Website
                </TableHead>
                <TableHead className="hidden text-[11px] font-bold uppercase tracking-wider text-[#a7abc3] xl:table-cell">
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
                      <BrandLogo
                        domain={brand.domain}
                        logoUrl={brand.logo_url}
                        imgClassName="size-9 rounded-md border border-[#ebeef0] object-contain p-1"
                        fallbackClassName="flex size-9 items-center justify-center rounded-md bg-brand/10 text-sm font-bold uppercase text-brand"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/brands/${brand.id}`}
                          className="block truncate font-semibold text-[#575962] hover:text-brand transition-colors"
                        >
                          {brand.domain}
                        </Link>
                        <a
                          href={brand.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex max-w-[220px] items-center gap-1 text-xs text-[#36a3f7] hover:underline lg:hidden"
                        >
                          <span className="truncate">{brand.url}</span>
                          <ExternalLinkIcon className="size-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <a
                      href={brand.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-[200px] items-center gap-1 text-sm text-[#36a3f7] hover:underline"
                    >
                      <span className="truncate">{brand.url}</span>
                      <ExternalLinkIcon className="size-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="hidden text-sm text-[#a7abc3] xl:table-cell">
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
                    <div className="flex flex-col items-stretch gap-1.5 lg:flex-row lg:justify-end">
                      <Link href={`/brands/${brand.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 w-full gap-1.5 border-[#ebeef0] text-[#575962] hover:border-brand hover:text-brand sm:w-auto"
                        >
                          <LayoutDashboardIcon className="size-3.5" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href={`/brands/${brand.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-11 w-full gap-1.5 text-[#a7abc3] hover:text-brand sm:w-auto"
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

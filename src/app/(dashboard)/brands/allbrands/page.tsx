import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sessionIsPlatformAdmin } from "@/lib/require-platform-admin";
import { AllBrandsTable } from "@/components/brands/all-brands-table";
import { ChevronRightIcon, HomeIcon } from "lucide-react";

export default async function AllBrandsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const isAdmin = await sessionIsPlatformAdmin(session.user);
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-[#a7abc3]">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 transition-colors hover:text-brand"
        >
          <HomeIcon className="size-3.5" />
          Home
        </Link>
        <ChevronRightIcon className="size-3" />
        <span>Manage Brand</span>
        <ChevronRightIcon className="size-3" />
        <span className="font-medium text-[#575962]">All Brands List</span>
      </nav>

      <div className="subheader">
        <h1 className="text-xl font-bold text-white">All Brands List</h1>
        <p className="mt-0.5 text-sm text-white/70">
          Platform-wide brand management (admin only)
        </p>
      </div>

      <div className="portlet p-6">
        <AllBrandsTable />
      </div>
    </div>
  );
}

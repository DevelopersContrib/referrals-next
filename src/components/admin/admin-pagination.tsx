import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Shared Prev / "Page X of Y" / Next pager for admin list pages.
 * Preserves arbitrary query params (search, status, campaign, …) across pages.
 * Server component — safe to render inside server-rendered admin pages.
 */
export function AdminPagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  /** Extra query params to keep on each page link (falsy values are dropped). */
  params?: Record<string, string | number | undefined | null>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    }
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)}>
          <Button variant="outline" size="sm">
            Previous
          </Button>
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)}>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </Link>
      )}
    </div>
  );
}

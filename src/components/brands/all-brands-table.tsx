"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  PlusIcon,
  DownloadIcon,
  Trash2Icon,
  SearchIcon,
  LayoutDashboardIcon,
  PencilIcon,
  Loader2Icon,
} from "lucide-react";

type BrandRow = {
  id: number;
  domain: string;
  url: string;
  ownerName: string;
  ownerId: number;
};

export function AllBrandsTable() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/brands/all?${params}`);
      if (!res.ok) throw new Error("Failed to load brands");

      const data = await res.json();
      setBrands(data.brands);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setSelected(new Set());
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const allOnPageSelected =
    brands.length > 0 && brands.every((b) => selected.has(b.id));

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(brands.map((b) => b.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (selected.size === 0) {
      toast.error("Please select brand first");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/brands/all/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`Deleted ${selected.size} brand(s)`);
      setConfirmOpen(false);
      await fetchBrands();
    } catch {
      toast.error("Failed to delete selected brands");
    } finally {
      setDeleting(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link href="/brands/new" target="_blank">
          <Button className="gap-2 bg-brand text-white hover:bg-brand-hover">
            <PlusIcon className="size-4" />
            Create Brand
          </Button>
        </Link>
        {total > 0 && (
          <a href="/api/brands/all/export">
            <Button className="gap-2 bg-[#28a745] text-white hover:bg-[#218838]">
              <DownloadIcon className="size-4" />
              Export All to CSV
            </Button>
          </a>
        )}
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => {
            if (selected.size === 0) {
              toast.error("Please select brand first");
              return;
            }
            setConfirmOpen(true);
          }}
        >
          <Trash2Icon className="size-4" />
          Delete Selected
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#a7abc3]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by domain or owner..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="portlet mt-4 overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#a7abc3]">
            <Loader2Icon className="size-5 animate-spin" />
            Loading brands...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#ebeef0] bg-[#f7f8fa]">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    className="size-4 rounded border-[#ebeef0]"
                    aria-label="Select all brands on this page"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Brand Name
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#a7abc3]">
                  Owner
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
                  className={`border-b border-[#ebeef0] transition-colors hover:bg-[#f7f8fa] ${
                    selected.has(brand.id) ? "bg-brand/5" : ""
                  }`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(brand.id)}
                      onChange={() => toggleOne(brand.id)}
                      className="size-4 rounded border-[#ebeef0]"
                      aria-label={`Select ${brand.domain}`}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-[#575962]">
                    {brand.domain}
                  </TableCell>
                  <TableCell className="text-sm text-[#575962]">
                    {brand.ownerName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/brands/${brand.id}`} target="_blank">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View dashboard"
                          className="text-[#a7abc3] hover:text-brand"
                        >
                          <LayoutDashboardIcon className="size-4" />
                        </Button>
                      </Link>
                      <Link href={`/brands/${brand.id}/edit`} target="_blank">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit brand"
                          className="text-[#a7abc3] hover:text-brand"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-[#a7abc3]"
                  >
                    No brands found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[#a7abc3]">
            Page {page} of {totalPages} ({total.toLocaleString()} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected brands?</DialogTitle>
            <DialogDescription>
              You are about to delete {selected.size} brand
              {selected.size !== 1 ? "s" : ""}. This will also remove their
              campaigns and social links. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

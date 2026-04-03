"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

interface Participant {
  id: number;
  campaign_id: number;
  email: string;
  name: string;
  date_signedup: string;
  photo: string | null;
  wallet_address: string | null;
  invited_by: number | null;
  ip_address: string | null;
  signup_url: string | null;
  referral_url: string | null;
  shares: number;
  clicks: number;
  referredCount: number;
}

interface ParticipantTableProps {
  campaignId: string;
  brandId: string;
  showExport?: boolean;
  compact?: boolean;
}

export function ParticipantTable({
  campaignId,
  brandId,
  showExport = true,
  compact = false,
}: ParticipantTableProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("date_signedup");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const limit = compact ? 5 : 20;

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });

      const response = await fetch(
        `/api/campaigns/${campaignId}/participants?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setParticipants(data.participants);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  }, [campaignId, page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  function handleExport() {
    window.open(`/api/campaigns/${campaignId}/export`, "_blank");
  }

  function SortIndicator({ column }: { column: string }) {
    if (sortBy !== column) return null;
    return <span className="ml-1">{sortOrder === "asc" ? " ^" : " v"}</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {showExport && (
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name
                <SortIndicator column="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("email")}
              >
                Email
                <SortIndicator column="email" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date_signedup")}
              >
                Date Joined
                <SortIndicator column="date_signedup" />
              </TableHead>
              {!compact && (
                <>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Referred</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={compact ? 3 : 6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : participants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={compact ? 3 : 6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No participants found
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    {new Date(p.date_signedup).toLocaleDateString()}
                  </TableCell>
                  {!compact && (
                    <>
                      <TableCell className="text-right">{p.shares}</TableCell>
                      <TableCell className="text-right">{p.clicks}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{p.referredCount}</Badge>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, total)} of {total} participants
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

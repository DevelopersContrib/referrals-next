"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";

interface Review {
  id: number;
  member_id: number;
  rating: number;
  message: string | null;
  approved: boolean | null;
  date_updated: string;
  memberName?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleAction(id: number, action: "approve" | "reject" | "delete") {
    try {
      if (action === "delete") {
        if (!confirm("Delete this review permanently?")) return;
        await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/reviews`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, approved: action === "approve" }),
        });
      }
      loadReviews();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">
          {reviews.length} total reviews
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-mono text-xs">
                    {review.id}
                  </TableCell>
                  <TableCell>#{review.member_id}</TableCell>
                  <TableCell>
                    {"*".repeat(review.rating)}{" "}
                    <span className="text-muted-foreground">
                      ({review.rating}/5)
                    </span>
                  </TableCell>
                  <TableCell className="max-w-64 truncate">
                    {review.message || "-"}
                  </TableCell>
                  <TableCell>
                    {review.approved ? (
                      <Badge className="bg-green-100 text-green-800">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(review.date_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!review.approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(review.id, "approve")}
                        >
                          Approve
                        </Button>
                      )}
                      {review.approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(review.id, "reject")}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction(review.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No reviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

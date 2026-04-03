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

interface Testimonial {
  id: number;
  member_id: number;
  message: string | null;
  approved: boolean | null;
  date_updated: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTestimonials() {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function handleAction(
    id: number,
    action: "approve" | "reject" | "delete"
  ) {
    try {
      if (action === "delete") {
        if (!confirm("Delete this testimonial permanently?")) return;
        await fetch(`/api/admin/testimonials?id=${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/testimonials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, approved: action === "approve" }),
        });
      }
      loadTestimonials();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading testimonials...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <p className="text-muted-foreground">
          {testimonials.length} total testimonials
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell>#{t.member_id}</TableCell>
                  <TableCell className="max-w-80 truncate">
                    {t.message || "-"}
                  </TableCell>
                  <TableCell>
                    {t.approved ? (
                      <Badge className="bg-green-100 text-green-800">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.date_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {!t.approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(t.id, "approve")}
                        >
                          Approve
                        </Button>
                      )}
                      {t.approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(t.id, "reject")}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleAction(t.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {testimonials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No testimonials found.
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

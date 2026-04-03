"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

interface Subdomain {
  id: number;
  url_id: number;
  created_by: number;
  subdomain: string | null;
  date_created: string;
  google_ua: string | null;
}

export default function AdminSubdomainsPage() {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSubdomains() {
    try {
      const res = await fetch("/api/admin/subdomains");
      if (res.ok) {
        const data = await res.json();
        setSubdomains(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubdomains();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this subdomain?")) return;
    try {
      await fetch(`/api/admin/subdomains?id=${id}`, { method: "DELETE" });
      loadSubdomains();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading subdomains...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Subdomains</h1>
        <p className="text-muted-foreground">
          {subdomains.length} whitelabel subdomains configured
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Brand ID</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Google UA</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                  <TableCell className="font-medium">
                    {sub.subdomain || "-"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/brands/${sub.url_id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{sub.url_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/members/${sub.created_by}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      #{sub.created_by}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {sub.google_ua || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(sub.date_created).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sub.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subdomains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No subdomains found.
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

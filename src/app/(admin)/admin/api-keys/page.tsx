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
import { Badge } from "@/components/ui/badge";

interface ApiKey {
  user_key_id: number;
  api_key: string | null;
  userid: number;
  date_generated: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadKeys() {
    try {
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleRevoke(id: number) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
      loadKeys();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading API keys...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          {keys.length} total API keys issued
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>API Key (masked)</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => {
                const masked = key.api_key
                  ? `${key.api_key.substring(0, 8)}...${key.api_key.slice(-4)}`
                  : "-";
                return (
                  <TableRow key={key.user_key_id}>
                    <TableCell className="font-mono text-xs">
                      {key.user_key_id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <Badge variant="secondary">{masked}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/members/${key.userid}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Member #{key.userid}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(key.date_generated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(key.user_key_id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {keys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No API keys found.
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

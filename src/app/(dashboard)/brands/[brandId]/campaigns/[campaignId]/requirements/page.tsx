"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Requirement {
  id: number;
  type: string;
  description: string;
  required: boolean;
  createdAt: string;
}

export default function CampaignRequirementsPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const brandId = params.brandId as string;

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(true);

  async function loadRequirements() {
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/requirements`
      );
      if (res.ok) {
        const data = await res.json();
        setRequirements(data.requirements || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequirements();
  }, [campaignId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/requirements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, description, required }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add requirement.");
        setSaving(false);
        return;
      }

      setType("");
      setDescription("");
      setRequired(true);
      await loadRequirements();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Campaign Requirements</h1>
        <p className="mt-1 text-muted-foreground">
          Add additional requirements that participants must meet for campaign{" "}
          #{campaignId}.
        </p>
      </div>

      {/* Add Requirement Form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add New Requirement</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Requirement Type</Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g., Social Follow, Purchase, Survey"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what participants need to do..."
                rows={3}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="required"
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="required" className="cursor-pointer">
                This requirement is mandatory
              </Label>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Requirement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Existing Requirements ({requirements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">
              Loading...
            </p>
          ) : requirements.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No requirements added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.type}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {req.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={req.required ? "default" : "secondary"}
                      >
                        {req.required ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

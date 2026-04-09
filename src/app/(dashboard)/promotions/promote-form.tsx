"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PromoteFormProps {
  campaigns: { id: string; name: string }[];
}

export function PromoteForm({ campaigns }: PromoteFormProps) {
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: parseInt(campaignId, 10) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit promotion.");
        setLoading(false);
        return;
      }

      setCampaignId("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Select
            value={campaignId}
            onValueChange={(value: string | null) =>
              setCampaignId(value || "")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign to promote" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading || !campaignId}>
          {loading ? "Submitting..." : "Submit for Promotion"}
        </Button>
      </div>
    </form>
  );
}

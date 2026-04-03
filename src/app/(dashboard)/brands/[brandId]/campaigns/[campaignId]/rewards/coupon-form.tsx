"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface RewardsCouponFormProps {
  campaignId: string;
}

export function RewardsCouponForm({ campaignId }: RewardsCouponFormProps) {
  const router = useRouter();
  const [codes, setCodes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const codeList = codes
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (codeList.length === 0) {
      toast.error("Please enter at least one coupon code");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupons: codeList,
        }),
      });

      if (!response.ok) throw new Error("Failed to save coupons");

      toast.success(`Added ${codeList.length} coupon(s)`);
      setCodes("");
      router.refresh();
    } catch {
      toast.error("Failed to add coupons");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Coupons</CardTitle>
        <CardDescription>
          Enter one coupon code per line. These will be distributed to
          participants who earn rewards.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codes">Coupon Codes</Label>
          <Textarea
            id="codes"
            placeholder={"SUMMER2024\nREFER20OFF\nFRIEND15"}
            rows={8}
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {codes.split("\n").filter((c) => c.trim()).length} code(s) entered
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? "Adding..." : "Add Coupons"}
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2Icon, GiftIcon, SaveIcon } from "lucide-react";
import { RewardConfigFields } from "@/components/campaigns/reward-config-fields";
import {
  buildRewardPayload,
  emptyRewardFormValues,
  getRewardKind,
  parseCouponCodes,
  rewardFormValuesFromRecord,
  validateRewardConfig,
  type RewardFormValues,
} from "@/lib/reward-types";

interface RewardType {
  id: number;
  name: string;
  has_value?: boolean;
}

interface CouponRow {
  id: number;
  code: string | null;
  is_used: boolean;
}

export function CampaignRewardSettings({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rewardTypes, setRewardTypes] = useState<RewardType[]>([]);
  const [rewardType, setRewardType] = useState("");
  const [values, setValues] = useState<RewardFormValues>(emptyRewardFormValues());
  const [coupons, setCoupons] = useState<CouponRow[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRewardTypes(data.rewardTypes || []);
      setRewardType(data.reward_type ? String(data.reward_type) : "");
      setValues(rewardFormValuesFromRecord(data.reward));
      setCoupons(data.couponList || []);
    } catch {
      toast.error("Failed to load reward settings");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedType = rewardTypes.find((t) => String(t.id) === rewardType);
  const kind = getRewardKind(selectedType?.name);

  const updateValue = (field: keyof RewardFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const couponStats = {
    total: coupons.length,
    available: coupons.filter((c) => !c.is_used).length,
  };

  async function handleSave() {
    const err = validateRewardConfig(kind, values);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reward_type: rewardType,
          reward: buildRewardPayload(kind, values),
          coupons: kind === "coupons" ? parseCouponCodes(values.coupon_codes) : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      toast.success("Reward settings saved");
      setValues((prev) => ({ ...prev, coupon_codes: "" }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save reward settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10">
              <GiftIcon className="size-5 text-brand" />
            </div>
            <div>
              <CardTitle>Reward settings</CardTitle>
              <CardDescription>
                Choose what participants receive when they hit the campaign goal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 lg:max-w-sm">
            <Label>Reward type</Label>
            <Select
              value={rewardType}
              onValueChange={(val: string | null) => setRewardType(val || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reward type">
                  {(value: string | null) =>
                    rewardTypes.find((r) => String(r.id) === value)?.name ??
                    "Select reward type"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {rewardTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType ? (
            <RewardConfigFields
              rewardTypeName={selectedType.name}
              values={values}
              onChange={updateValue}
              couponStats={couponStats}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a reward type to configure it.
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              Save reward settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coupon inventory — only relevant for coupon rewards */}
      {kind === "coupons" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Coupons ({couponStats.total} total, {couponStats.available} available)
            </CardTitle>
            <CardDescription>
              Codes distributed to participants who earn the reward. New codes
              entered above are appended on save.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {coupons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No coupons added yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add coupon codes in the field above, then save.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">
                        {coupon.code || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_used ? "secondary" : "default"}>
                          {coupon.is_used ? "Used" : "Available"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

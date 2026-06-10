"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRewardKind, type RewardFormValues } from "@/lib/reward-types";

interface RewardConfigFieldsProps {
  rewardTypeName: string;
  values: RewardFormValues;
  onChange: (field: keyof RewardFormValues, value: string) => void;
  couponStats?: { total: number; available: number };
}

export function RewardConfigFields({
  rewardTypeName,
  values,
  onChange,
  couponStats,
}: RewardConfigFieldsProps) {
  const kind = getRewardKind(rewardTypeName);

  if (kind === "coupons") {
    return (
      <div className="space-y-2">
        {couponStats && couponStats.total > 0 && (
          <p className="text-sm text-muted-foreground">
            {couponStats.total} coupon{couponStats.total === 1 ? "" : "s"} on file (
            {couponStats.available} available). New codes below are added on save.
          </p>
        )}
        <Label htmlFor="coupon_codes">
          {couponStats && couponStats.total > 0 ? "Add coupon codes" : "Coupon codes"}
        </Label>
        <Textarea
          id="coupon_codes"
          placeholder={"SUMMER2024\nREFER20OFF\nFRIEND15"}
          rows={6}
          value={values.coupon_codes}
          onChange={(e) => onChange("coupon_codes", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">One code per line.</p>
      </div>
    );
  }

  if (kind === "redirect") {
    return (
      <div className="space-y-2">
        <Label htmlFor="redirect_url">Redirect URL</Label>
        <Input
          id="redirect_url"
          type="url"
          placeholder="https://yoursite.com/reward"
          value={values.redirect_url}
          onChange={(e) => onChange("redirect_url", e.target.value)}
        />
      </div>
    );
  }

  if (kind === "custom") {
    return (
      <div className="space-y-2">
        <Label htmlFor="custom_message">Custom message</Label>
        <Textarea
          id="custom_message"
          rows={5}
          placeholder="Thanks for referring friends! Here's your exclusive reward..."
          value={values.custom_message}
          onChange={(e) => onChange("custom_message", e.target.value)}
        />
      </div>
    );
  }

  if (kind === "cash") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cash_value">Cash amount (USD)</Label>
          <Input
            id="cash_value"
            type="number"
            min={0}
            step="0.01"
            placeholder="25.00"
            value={values.cash_value}
            onChange={(e) => onChange("cash_value", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="worth_value">Displayed value (optional)</Label>
          <Input
            id="worth_value"
            type="number"
            min={0}
            step="0.01"
            placeholder="50.00"
            value={values.worth_value}
            onChange={(e) => onChange("worth_value", e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (kind === "tokens") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="token_symbol">Token symbol</Label>
          <Input
            id="token_symbol"
            placeholder="ETH"
            value={values.token_symbol}
            onChange={(e) => onChange("token_symbol", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="token_amount">Token amount</Label>
          <Input
            id="token_amount"
            placeholder="0.01"
            value={values.token_amount}
            onChange={(e) => onChange("token_amount", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="token_address">Contract address (optional)</Label>
          <Input
            id="token_address"
            placeholder="0x..."
            value={values.token_address}
            onChange={(e) => onChange("token_address", e.target.value)}
          />
        </div>
      </div>
    );
  }

  return null;
}

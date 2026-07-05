"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import {
  getRewardKind,
  parseCouponCodes,
  type RewardFormValues,
} from "@/lib/reward-types";
import { generateCouponCodes } from "@/lib/coupon-generator";

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
        <CouponGenerator
          currentValue={values.coupon_codes}
          onAppend={(next) => onChange("coupon_codes", next)}
        />
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
      <div className="grid gap-4 lg:grid-cols-2">
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
      <div className="grid gap-4 lg:grid-cols-2">
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

function CouponGenerator({
  currentValue,
  onAppend,
}: {
  currentValue: string;
  onAppend: (nextValue: string) => void;
}) {
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("");
  const [length, setLength] = useState("8");

  function handleGenerate() {
    const existing = parseCouponCodes(currentValue);
    const generated = generateCouponCodes({
      count: parseInt(count, 10) || 0,
      length: parseInt(length, 10) || 8,
      prefix,
      exclude: existing,
    });
    if (generated.length === 0) return;
    const merged = [...existing, ...generated].join("\n");
    onAppend(merged);
  }

  return (
    <div className="rounded-lg border border-dashed border-brand/30 bg-brand/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#575962]">
        <SparklesIcon className="size-4 text-brand" />
        Generate codes
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="gen_count" className="text-xs">
            How many
          </Label>
          <Input
            id="gen_count"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gen_prefix" className="text-xs">
            Prefix (optional)
          </Label>
          <Input
            id="gen_prefix"
            placeholder="SAVE-"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gen_length" className="text-xs">
            Length
          </Label>
          <Input
            id="gen_length"
            type="number"
            min={3}
            max={32}
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={handleGenerate}
          className="col-span-2 gap-1.5 sm:col-span-1"
        >
          <SparklesIcon className="size-4" />
          Generate
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Creates unique codes (excludes ambiguous characters) and appends them to
        the list above. They&apos;re saved when you save the reward.
      </p>
    </div>
  );
}

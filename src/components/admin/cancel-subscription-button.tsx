"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

/**
 * Two-step confirm for a destructive, outward-facing action (calls PayPal to
 * cancel a live billing agreement). First click reveals a reason field +
 * explicit "Confirm cancel"; second click performs the cancellation.
 */
export function CancelSubscriptionButton({
  subscriptionId,
  memberEmail,
}: {
  subscriptionId: number;
  memberEmail: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      toast.success(
        data.alreadyCancelled
          ? "Already cancelled."
          : `Subscription cancelled${memberEmail ? ` for ${memberEmail}` : ""}.`
      );
      setConfirming(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        onClick={() => setConfirming(true)}
      >
        Cancel
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        className="h-8 w-40 text-xs"
        disabled={loading}
      />
      <Button
        type="button"
        size="sm"
        className="h-8 bg-rose-600 text-white hover:bg-rose-700"
        onClick={cancel}
        disabled={loading}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Confirm cancel"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() => setConfirming(false)}
        disabled={loading}
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

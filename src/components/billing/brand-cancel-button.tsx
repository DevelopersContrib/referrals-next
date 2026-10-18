"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BrandCancelButtonProps = {
  brandId: number;
  brandName: string;
  /** Already formatted, e.g. "Nov 18, 2026". */
  liveUntil: string;
};

/** Cancels this brand's own subscription; the brand stays live until liveUntil. */
export function BrandCancelButton({ brandId, brandName, liveUntil }: BrandCancelButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/brands/${brandId}/billing/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Cancellation failed");
        return;
      }
      toast.success(`Cancelled. ${brandName} stays live until ${liveUntil}.`);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        Cancel plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel {brandName}&apos;s plan?</DialogTitle>
            <DialogDescription>
              You won&apos;t be charged again. {brandName} stays live until {liveUntil},
              then goes private. Your campaigns and people are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={cancelling}
            >
              Keep plan
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
              className="min-h-11"
            >
              {cancelling && <Loader2Icon className="size-4 animate-spin" />}
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

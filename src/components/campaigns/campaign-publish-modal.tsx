"use client";

import { useState } from "react";
import Link from "next/link";
import { RocketIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

/**
 * The publish decision, shown once right after a campaign is created on a brand
 * that is not paying yet.
 *
 * Escape and outside clicks are ignored on purpose: the owner picks publish or
 * private rather than dismissing by accident and wondering why nobody can sign
 * up. Both choices are real buttons, so there is always a way out.
 */
export function CampaignPublishModal({
  brandName,
  checkoutHref,
}: {
  brandName: string;
  checkoutHref: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      // Swallow escapeKey / outsidePress — only the buttons below close this.
      onOpenChange={() => {}}
      disablePointerDismissal
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your campaign is ready</DialogTitle>
          <DialogDescription>
            Publish{" "}
            <span className="font-medium text-foreground">{brandName}</span> for
            $9/mo to start taking signups.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Until you publish it stays private — the widget and share links will
          not accept signups. You can cancel anytime and it goes back to
          private.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep it private for now
          </Button>
          <Link
            href={checkoutHref}
            className={cn(buttonVariants(), "gap-2")}
          >
            <RocketIcon className="size-4" aria-hidden="true" />
            Publish for $9/mo
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

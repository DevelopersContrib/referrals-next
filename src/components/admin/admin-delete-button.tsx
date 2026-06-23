"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Generic destructive delete for admin list rows. Replaces the per-entity
 * delete buttons that were all identical save for the endpoint and label.
 */
export function AdminDeleteButton({
  endpoint,
  label = "item",
  onDeleted,
}: {
  /** DELETE target, e.g. `/api/admin/coupons/123`. */
  endpoint: string;
  /** Lowercase noun used in the confirm + toast, e.g. "coupon". */
  label?: string;
  /** Called after a successful delete; defaults to router.refresh(). */
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete this ${label}? This cannot be undone.`))
      return;

    setDeleting(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} deleted`);
      if (onDeleted) onDeleted();
      else router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${label}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
      {deleting ? "Deleting…" : "Delete"}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Kind = "network" | "subdomain" | "custom";
type Status = { live: boolean; records: { type: string; name: string; value: string }[]; note: string | null };

/** Check an address's DNS on Vercel, and disconnect a brand's white-label address. */
export function DomainActions({
  kind,
  id,
  host,
  canCheck,
  canDisconnect = false,
}: {
  kind: Kind;
  id: string;
  host: string;
  canCheck: boolean;
  canDisconnect?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"check" | "disconnect" | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  async function call(action: "check" | "disconnect") {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, kind, id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      return body;
    } finally {
      setBusy(null);
    }
  }

  async function check() {
    try {
      setStatus((await call("check")).status);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't check that address.");
    }
  }

  async function disconnect() {
    if (!window.confirm(`Disconnect ${host}? The brand stops being served there and the owner has to add it again.`)) {
      return;
    }
    try {
      await call("disconnect");
      toast.success(`${host} disconnected.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't disconnect that address.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {canCheck && (
          <Button size="sm" variant="outline" onClick={check} disabled={busy !== null}>
            {busy === "check" ? "Checking…" : "Check DNS"}
          </Button>
        )}
        {canDisconnect && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={disconnect} disabled={busy !== null}>
            {busy === "disconnect" ? "Removing…" : "Disconnect"}
          </Button>
        )}
      </div>
      {status && (
        <div className="max-w-xs text-left text-xs">
          <p className={status.live ? "font-medium text-green-700" : "font-medium text-amber-700"}>
            {status.live ? "Live" : status.note || "Not live yet"}
          </p>
          {status.records.map((r) => (
            <p key={`${r.type}-${r.name}`} className="font-mono text-[11px] text-muted-foreground">
              {r.type} {r.name} → {r.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { LinkIcon, CopyIcon, CheckIcon } from "lucide-react";

type Campaign = { id: number; name: string };

/**
 * Brand-level referral link. One link per brand: `referrals.com/go/<domain>`.
 * The brand designates the ONE campaign its referrals attribute to (dropdown).
 * No script needed — the link is script-free, server-side attributed.
 */
export function BrandReferralLink({ brandId }: { brandId: string }) {
  const [domain, setDomain] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`/api/brands/${brandId}`),
          fetch(`/api/campaigns?brandId=${brandId}`),
        ]);
        const b = await bRes.json();
        const c = await cRes.json();
        if (!alive) return;
        setDomain(b?.domain || "");
        setSelected(b?.referral_campaign_id ? String(b.referral_campaign_id) : "");
        const list: unknown = Array.isArray(c) ? c : c?.campaigns;
        setCampaigns(
          (Array.isArray(list) ? list : []).map((x: { id: number; name: string }) => ({ id: x.id, name: x.name }))
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [brandId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.referrals.com";
  const link = domain ? `${origin}/go/${domain}` : "";

  const save = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_campaign_id: selected ? Number(selected) : null }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [brandId, selected]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — select manually */
    }
  }, [link]);

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <LinkIcon className="size-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-[#464457]">Referral link</h3>
          <p className="text-xs text-[#a7abc3]">
            One link for this brand. Share it anywhere — no script needed. New sign-ups it drives earn you the reward.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-[#a7abc3]">Loading…</p>
      ) : (
        <div className="mt-5 space-y-4">
          {/* The link */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#a7abc3]">
              Your link
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-[#ebeef0] bg-[#f7f8fa] px-3 py-2.5 text-sm text-[#575962]">
                {link || "—"}
              </code>
              <button
                type="button"
                onClick={copy}
                disabled={!link}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#ebeef0] px-3.5 text-sm font-semibold text-[#575962] transition-colors hover:border-brand/30 hover:text-brand disabled:opacity-50"
              >
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Campaign designation */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#a7abc3]">
              Attribute to campaign
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-[#ebeef0] bg-white px-3 text-sm text-[#575962] focus:border-brand focus:outline-none"
              >
                <option value="">Default — referrals.com signup program</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#a7abc3]">
              The one campaign this brand&rsquo;s referrals count toward. Leave as default to feed the referrals.com signup-referral program.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ENGAGEMENT_ENROLL_CONFIRM_TOKEN,
  ENGAGEMENT_ENROLL_DEFAULT_LIMIT,
  ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS,
  ENGAGEMENT_ENROLL_LARGE_SEGMENT_THRESHOLD,
  ENGAGEMENT_ENROLL_MAX_LIMIT,
} from "@/lib/engagement-enroll-guards";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: {
    limit: number;
    spreadDays: number;
    confirmEnroll?: string;
  }) => Promise<void>;
  campaignName: string;
  segmentName: string;
  memberCount: number;
  busy?: boolean;
};

export default function EnrollConfirmDialog({
  open,
  onClose,
  onConfirm,
  campaignName,
  segmentName,
  memberCount,
  busy = false,
}: Props) {
  const [limit, setLimit] = useState(ENGAGEMENT_ENROLL_DEFAULT_LIMIT);
  const [spreadDays, setSpreadDays] = useState(ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS);
  const [confirmText, setConfirmText] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);

  const needsTypedConfirm = memberCount >= ENGAGEMENT_ENROLL_LARGE_SEGMENT_THRESHOLD;
  const enrollUpTo = Math.min(limit, memberCount);

  useEffect(() => {
    if (!open) return;
    setLimit(ENGAGEMENT_ENROLL_DEFAULT_LIMIT);
    setSpreadDays(ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS);
    setConfirmText("");
    setLocalErr(null);
  }, [open, campaignName, segmentName, memberCount]);

  if (!open) return null;

  async function submit() {
    setLocalErr(null);
    if (needsTypedConfirm && confirmText.trim() !== ENGAGEMENT_ENROLL_CONFIRM_TOKEN) {
      setLocalErr(`Type ${ENGAGEMENT_ENROLL_CONFIRM_TOKEN} to enroll a large segment.`);
      return;
    }
    await onConfirm({
      limit,
      spreadDays,
      confirmEnroll: needsTypedConfirm ? ENGAGEMENT_ENROLL_CONFIRM_TOKEN : undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-stone-200 bg-white p-6 shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="enroll-confirm-title" style={{ margin: "0 0 8px" }}>
          Confirm enrollment
        </h3>
        <p className="soft" style={{ margin: "0 0 12px", maxWidth: "48ch" }}>
          Campaign: <strong>{campaignName}</strong>
          <br />
          Segment: <strong>{segmentName}</strong>
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "1.05rem" }}>
          Enroll up to <strong>{enrollUpTo.toLocaleString()}</strong> of{" "}
          <strong>{memberCount.toLocaleString()}</strong> members
        </p>

        <label className="admin-engage-email">
          <span>Batch size (max {ENGAGEMENT_ENROLL_MAX_LIMIT})</span>
          <input
            type="number"
            min={1}
            max={ENGAGEMENT_ENROLL_MAX_LIMIT}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || ENGAGEMENT_ENROLL_DEFAULT_LIMIT)}
            disabled={busy}
          />
        </label>
        <label className="admin-engage-email">
          <span>Spread first sends over (days)</span>
          <input
            type="number"
            min={1}
            max={30}
            value={spreadDays}
            onChange={(e) =>
              setSpreadDays(Number(e.target.value) || ENGAGEMENT_ENROLL_DEFAULT_SPREAD_DAYS)
            }
            disabled={busy}
          />
        </label>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: "0.85rem" }}>
          Personal 1:1 emails — not a mass blast. Cron sends what&apos;s due about every 15 minutes.
        </p>

        {needsTypedConfirm ? (
          <label className="admin-engage-email">
            <span>
              Type <strong>{ENGAGEMENT_ENROLL_CONFIRM_TOKEN}</strong> to confirm (
              {memberCount.toLocaleString()} members)
            </span>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={ENGAGEMENT_ENROLL_CONFIRM_TOKEN}
              disabled={busy}
              autoComplete="off"
            />
          </label>
        ) : null}

        {localErr ? (
          <p className="admin-engage-banner err" style={{ marginBottom: 12 }} role="alert">
            {localErr}
          </p>
        ) : null}

        <div className="admin-engage-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Enrolling…" : "Enroll batch"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EngagementCampaignsPanel from "@/components/engagement/EngagementCampaignsPanel";
import EnrollConfirmDialog from "@/components/engagement/EnrollConfirmDialog";
import "./engagement.css";

export type EngagementAdminStatus = {
  enabled: boolean;
  configured: boolean;
  domainKey: string;
  domainId: number;
  campaignKey: string;
  vnocCampaignId: number;
  stepCount: number;
  lastSyncedAt: string | null;
  enrollments: Record<string, number>;
  hasVnocUrl: boolean;
  hasFromEmail: boolean;
};

export type EngagementBrowseEmail = {
  id: number;
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string | null;
  enabled: boolean;
  when: string;
};

export type EngagementBrowseCampaign = {
  id?: number;
  key: string;
  name: string;
  blurb: string;
  enabled?: boolean;
  segmentKey?: string | null;
  segmentName?: string | null;
  emailCount: number;
  emails: EngagementBrowseEmail[];
};

export type EngagementBrowsePerson = {
  id: number;
  userId: number;
  email: string;
  name: string;
  plan: string;
  campaignKey: string | null;
  campaignName: string | null;
  status: string;
  currentStep: number;
  nextAt: string | null;
  enrolledAt: string;
};

export type EngagementBrowseSend = {
  id: number;
  email: string;
  campaignName: string;
  stepOrder: number;
  status: string;
  sentAt: string;
  error: string | null;
};

export type EngagementBrowse = {
  campaigns: EngagementBrowseCampaign[];
  people: EngagementBrowsePerson[];
  sends: EngagementBrowseSend[];
  subscriberTotal?: number;
  inSequence?: number;
};

export type EngagementSegment = {
  id: number;
  key: string;
  name: string;
  description: string;
  rules: Record<string, unknown>;
  source: string;
  enabled: boolean;
  memberCount: number;
  createdAt: string;
};

type Tab = "campaigns" | "people" | "segments" | "sent";

function formatRules(rules: Record<string, unknown>): string {
  const parts: string[] = [];
  if (rules.plan && rules.plan !== "any") parts.push(String(rules.plan));
  if (rules.hasQuotes === true) parts.push("has campaigns");
  if (rules.hasQuotes === false) parts.push("no campaigns");
  if (typeof rules.registeredWithinDays === "number") {
    parts.push(`last ${rules.registeredWithinDays}d`);
  }
  if (typeof rules.registeredBeforeDays === "number") {
    parts.push(`${rules.registeredBeforeDays}+ days old`);
  }
  if (rules.inWelcomeSequence === true) parts.push("in welcome");
  if (rules.notInWelcomeSequence === true) parts.push("not in welcome");
  return parts.length ? parts.join(" · ") : "all members";
}

/** Stable across SSR + client (no Date.now / locale). */
function formatDateUtc(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hr ago`;
  return formatDateUtc(iso);
}

/** Relative label only after mount — avoids hydration mismatch from Date.now(). */
function RelativeTime({ iso }: { iso: string | null }) {
  const [label, setLabel] = useState(() => formatDateUtc(iso));
  useEffect(() => {
    if (!iso) {
      setLabel("—");
      return;
    }
    setLabel(relativeTime(iso));
  }, [iso]);
  return <span suppressHydrationWarning>{label}</span>;
}

/** Alias kept so a stale HMR bundle that still calls timeAgo won't crash. */
function timeAgo(iso: string | null): string {
  return formatDateUtc(iso);
}

export type EngagementMailStatus = {
  hasAwsKeys: boolean;
  autoresponderEnabled: boolean;
};

export default function EngagementClient({
  status,
  engagement,
  browse: initialBrowse,
  initialSegments = [],
  defaultEmail,
}: {
  status: EngagementMailStatus;
  engagement: EngagementAdminStatus;
  browse: EngagementBrowse;
  initialSegments?: EngagementSegment[];
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [eng, setEng] = useState(engagement);
  const [browse, setBrowse] = useState(initialBrowse);
  const [segments, setSegments] = useState<EngagementSegment[]>(initialSegments);
  const [tab, setTab] = useState<Tab>("campaigns");
  const [segmentEnroll, setSegmentEnroll] = useState<{
    campaignKey: string;
    campaignName: string;
    segmentName: string;
    memberCount: number;
  } | null>(null);
  const [bulkEnrollOpen, setBulkEnrollOpen] = useState(false);
  const [bulkEligible, setBulkEligible] = useState(0);

  // Keep props in sync after navigation / HMR so SSR and client don't diverge
  useEffect(() => {
    setEng(engagement);
    setBrowse(initialBrowse);
    setSegments(initialSegments);
  }, [engagement, initialBrowse, initialSegments]);

  const mailReady = status.hasAwsKeys && eng.hasFromEmail;
  const campaignReady = eng.stepCount > 0 || browse.campaigns.length > 0;
  const subscriberTotal = browse.subscriberTotal ?? browse.people.length;
  const inSequence = browse.inSequence ?? eng.enrollments.active ?? 0;
  const sentCount = browse.sends.filter((s) => s.status === "sent").length;
  const skippedCount = browse.sends.filter((s) => s.status === "skipped").length;
  const failedCount = browse.sends.filter((s) => s.status === "failed").length;
  const emailTotal = browse.campaigns.reduce((n, c) => n + (c.emailCount || 0), 0);

  async function refreshBrowse() {
    const res = await fetch("/api/admin/engagement/browse");
    const data = (await res.json().catch(() => ({}))) as EngagementBrowse & { ok?: boolean };
    if (res.ok && data.campaigns) {
      setBrowse({
        campaigns: data.campaigns,
        people: data.people,
        sends: data.sends,
        subscriberTotal: data.subscriberTotal,
        inSequence: data.inSequence,
      });
    }
  }

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    setMsg(null);
    setErr(null);
    try {
      await fn();
    } catch {
      setErr("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function syncEngagement() {
    await run("sync", async () => {
      const res = await fetch("/api/admin/engagement/sync", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; upserted?: number; error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t load campaign emails.");
        return;
      }
      const n = data.upserted ?? 0;
      setMsg(n > 0 ? `Loaded ${n} campaign email${n === 1 ? "" : "s"}.` : "No campaign emails found.");
      setEng((prev) => ({
        ...prev,
        stepCount: n || prev.stepCount,
        lastSyncedAt: new Date().toISOString(),
        configured: true,
      }));
      await refreshBrowse();
    });
  }

  async function tryWelcomeFlow() {
    await run("flow", async () => {
      if (!campaignReady) {
        const syncRes = await fetch("/api/admin/engagement/sync", { method: "POST" });
        if (!syncRes.ok) {
          const syncData = (await syncRes.json().catch(() => ({}))) as { error?: string };
          setErr(syncData.error || "Couldn’t load the campaign first.");
          return;
        }
      }
      const enrollRes = await fetch("/api/admin/engagement/enroll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const enrollData = (await enrollRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!enrollRes.ok) {
        setErr(
          enrollData.error === "member not found"
            ? `No account for ${email.trim()}. Sign up with that email first.`
            : enrollData.error || "Couldn’t start the welcome sequence."
        );
        return;
      }
      const tickRes = await fetch("/api/admin/engagement/tick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 5 }),
      });
      const tickData = (await tickRes.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: number;
        error?: string;
      };
      if (!tickRes.ok) {
        setErr(tickData.error || "Sequence started, but sending failed.");
        return;
      }
      const sent = tickData.sent ?? 0;
      setMsg(
        sent > 0
          ? `Sent ${sent} email to ${email.trim()}. Check that inbox — and the Sent tab below.`
          : `Added ${email.trim()} to the sequence. Nothing was due to send yet.`
      );
      await refreshBrowse();
      setTab("sent");
    });
  }

  async function refreshSegments() {
    const res = await fetch("/api/admin/engagement/segments");
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      segments?: EngagementSegment[];
    };
    if (res.ok && data.segments) setSegments(data.segments);
  }

  async function aiCreateSegments() {
    await run("segments", async () => {
      const res = await fetch("/api/admin/engagement/segments", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        created?: number;
        updated?: number;
        ai?: boolean;
        segments?: EngagementSegment[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t create segments.");
        return;
      }
      if (data.segments) setSegments(data.segments);
      const c = data.created ?? 0;
      const u = data.updated ?? 0;
      setMsg(
        data.ai
          ? `AI saved ${c + u} segment${c + u === 1 ? "" : "s"} (${c} new, ${u} updated). Live counts below.`
          : `Saved ${c + u} default segment${c + u === 1 ? "" : "s"} (${c} new, ${u} updated). Add ANTHROPIC_API_KEY for AI-generated ones.`
      );
      setTab("segments");
    });
  }

  async function removeSegment(id: number) {
    if (!window.confirm("Delete this segment?")) return;
    await run(`del-seg-${id}`, async () => {
      const res = await fetch(`/api/admin/engagement/segments/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t delete segment.");
        return;
      }
      setSegments((prev) => prev.filter((s) => s.id !== id));
      setMsg("Segment deleted.");
    });
  }

  async function createCampaignsForAllSegments() {
    if (
      !confirm(
        "Create branded campaigns for every segment that doesn’t have one yet?\n\nEach gets 10 Referrals-branded feature emails (logo + layout). Missing emails on existing campaigns are backfilled. You can edit or AI-improve copy anytime."
      )
    ) {
      return;
    }
    await run("camps-all", async () => {
      const res = await fetch("/api/admin/engagement/campaigns/ensure-all", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        created?: number;
        skipped?: number;
        campaigns?: EngagementBrowseCampaign[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t create segment campaigns.");
        return;
      }
      if (data.campaigns) setBrowse((b) => ({ ...b, campaigns: data.campaigns! }));
      else await refreshBrowse();
      await refreshSegments();
      setMsg(
        `Created ${data.created ?? 0} campaign${(data.created ?? 0) === 1 ? "" : "s"}` +
          ((data.skipped ?? 0) > 0 ? ` (${data.skipped} already had one).` : ".") +
          " Review under Campaigns & emails."
      );
      setTab("campaigns");
    });
  }

  async function createCampaignForSegment(segmentKey: string) {
    await run(`camp-${segmentKey}`, async () => {
      const res = await fetch("/api/admin/engagement/campaigns/from-segment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ segmentKey, draftEmails: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        campaignKey?: string;
        emailsCreated?: number;
        ai?: boolean;
        campaigns?: EngagementBrowseCampaign[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t create campaign.");
        return;
      }
      if (data.campaigns) setBrowse((b) => ({ ...b, campaigns: data.campaigns! }));
      else await refreshBrowse();
      const n = data.emailsCreated ?? 0;
      setMsg(
        data.ai
          ? `Campaign created with ${n} AI-drafted email${n === 1 ? "" : "s"}. Review copy, then enroll a batch.`
          : `Campaign created with ${n} starter email${n === 1 ? "" : "s"}. Edit copy, then enroll a batch.`
      );
      setTab("campaigns");
    });
  }

  async function submitSegmentEnroll(opts: {
    limit: number;
    spreadDays: number;
    confirmEnroll?: string;
  }) {
    if (!segmentEnroll) return;
    await run(`enroll-${segmentEnroll.campaignKey}`, async () => {
      const res = await fetch("/api/admin/engagement/enroll-segment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignKey: segmentEnroll.campaignKey,
          limit: opts.limit,
          spreadDays: opts.spreadDays,
          confirmEnroll: opts.confirmEnroll,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t enroll segment.");
        return;
      }
      setSegmentEnroll(null);
      setMsg(data.message || "Enrollment started.");
      await refreshBrowse();
      setTab("people");
    });
  }

  async function openBulkEnrollDialog() {
    setErr(null);
    const res = await fetch("/api/admin/engagement/enroll-bulk");
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; eligible?: number; error?: string };
    if (!res.ok) {
      setErr(data.error || "Couldn’t load eligible members.");
      return;
    }
    const eligible = data.eligible ?? 0;
    if (eligible <= 0) {
      setMsg("Everyone eligible is already enrolled.");
      return;
    }
    setBulkEligible(eligible);
    setBulkEnrollOpen(true);
  }

  async function submitBulkEnroll(opts: {
    limit: number;
    spreadDays: number;
    confirmEnroll?: string;
  }) {
    await run("bulk", async () => {
      const res = await fetch("/api/admin/engagement/enroll-bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          limit: opts.limit,
          freeOnly: true,
          spreadDays: opts.spreadDays,
          confirmEnroll: opts.confirmEnroll,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Bulk enroll failed.");
        return;
      }
      setBulkEnrollOpen(false);
      setMsg(data.message || "Bulk enrollment started.");
      await refreshBrowse();
      setTab("people");
    });
  }

  async function tickDue() {
    await run("tick", async () => {
      const res = await fetch("/api/admin/engagement/tick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: number;
        skipped?: number;
        processed?: number;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t send due emails.");
        return;
      }
      setMsg(
        `Processed ${data.processed ?? 0}: sent ${data.sent ?? 0}, skipped ${data.skipped ?? 0}.`
      );
      await refreshBrowse();
    });
  }

  async function sendAutoresponderTest() {
    await run("ar", async () => {
      const res = await fetch("/api/admin/engagement/autoresponder-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        to?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t send test auto-reply.");
        return;
      }
      setMsg(`Test auto-reply sent to ${data.to || email.trim()}.`);
    });
  }

  return (
    <div className="engagement-panel admin-page stack">
      <header className="admin-engage-intro">
        <h1 className="admin-engage-title">Emails &amp; AI</h1>
        <p className="soft admin-engage-lede">
          Personal 1:1 nurture for brand managers — campaigns, 10-email product tours, AI segments.
          Edit any template anytime. Not mass blasts.
        </p>
      </header>

      <section className="admin-stats-grid">
        <div className={`card admin-stat-card${campaignReady ? " admin-stat-highlight" : ""}`}>
          <span className="admin-stat-value">{browse.campaigns.length}</span>
          <span className="admin-stat-label">Campaigns</span>
          <span className="admin-stat-hint muted">{emailTotal} emails total</span>
        </div>
        <div className="card admin-stat-card admin-stat-highlight">
          <span className="admin-stat-value">{inSequence.toLocaleString()}</span>
          <span className="admin-stat-label">Active in a sequence</span>
          <span className="admin-stat-hint muted">
            {subscriberTotal.toLocaleString()} members total
          </span>
        </div>
        <div className="card admin-stat-card">
          <span className="admin-stat-value">{sentCount}</span>
          <span className="admin-stat-label">Recent sends</span>
          <span className="admin-stat-hint muted">
            {skippedCount} skipped · {failedCount} failed
          </span>
        </div>
        <div className={`card admin-stat-card${mailReady ? " admin-stat-highlight" : ""}`}>
          <span className="admin-stat-value">{mailReady ? "Ready" : "Setup"}</span>
          <span className="admin-stat-label">Sending mail</span>
          <span className="admin-stat-hint muted">
            {mailReady ? "SES / delivery configured" : "Needs From + AWS"}
          </span>
        </div>
      </section>

      <div className="admin-engage-health">
        <span className="admin-engage-health-label">Send health</span>
        <span>
          <strong>{sentCount}</strong> sent
        </span>
        <span className="sep" aria-hidden />
        <span>
          <strong>{skippedCount}</strong> skipped
        </span>
        <span className="sep" aria-hidden />
        <span>
          <strong>{failedCount}</strong> failed
        </span>
        <span className="sep" aria-hidden />
        <span>
          <strong>{inSequence.toLocaleString()}</strong> active enrollments
        </span>
        <span className="sep" aria-hidden />
        <span className="muted">
          {eng.lastSyncedAt ? (
            <>
              Synced <RelativeTime iso={eng.lastSyncedAt} />
            </>
          ) : (
            "Templates ready to edit"
          )}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: "auto" }}
          disabled={Boolean(busy)}
          onClick={() => void refreshBrowse()}
        >
          Refresh
        </button>
      </div>

      {(msg || err) && (
        <div className={err ? "admin-engage-banner err" : "admin-engage-banner ok"} role="status">
          {err || msg}
        </div>
      )}

      <section className="card admin-panel">
        <div className="admin-panel-head">
          <h2>Campaigns &amp; emails</h2>
          <div className="admin-engage-actions" style={{ margin: 0 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={Boolean(busy)}
              onClick={() => void refreshBrowse()}
            >
              Reload
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={Boolean(busy) || !eng.hasVnocUrl}
              onClick={() => void syncEngagement()}
            >
              {busy === "sync" ? "Loading…" : "Load emails"}
            </button>
          </div>
        </div>

        <div className="admin-engage-tabs" role="tablist">
          {(
            [
              ["campaigns", "Campaigns & emails"],
              ["people", `People (${subscriberTotal.toLocaleString()})`],
              ["segments", `Segments (${segments.length})`],
              ["sent", `Sent (${browse.sends.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`admin-engage-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "campaigns" ? (
          <EngagementCampaignsPanel
            initialCampaigns={browse.campaigns}
            segments={segments.map((s) => ({ key: s.key, name: s.name, memberCount: s.memberCount }))}
            defaultEmail={email}
            onChange={(campaigns) => setBrowse((b) => ({ ...b, campaigns }))}
          />
        ) : null}

        {tab === "people" ? (
          <div className="admin-table-scroll">
            <p className="soft" style={{ marginTop: 0, maxWidth: "62ch", padding: "12px 14px 0" }}>
              Members on Referrals ({subscriberTotal.toLocaleString()} total). Showing the{" "}
              {browse.people.length} most recent. Status is <strong>subscriber</strong> until they’re
              enrolled in a campaign sequence.
            </p>
            {browse.people.length === 0 ? (
              <p className="muted">No members found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Plan</th>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {browse.people.map((p) => (
                    <tr key={`u-${p.userId}`}>
                      <td>
                        <div>{p.name}</div>
                        <div className="admin-cell-muted">{p.email}</div>
                      </td>
                      <td>{p.plan}</td>
                      <td>{p.campaignName || "—"}</td>
                      <td>
                        {p.status === "subscriber" ? "Subscriber" : p.status}
                        {p.status !== "subscriber" ? (
                          <span className="admin-cell-muted"> · step {p.currentStep + 1}</span>
                        ) : null}
                      </td>
                      <td>
                        <RelativeTime iso={p.enrolledAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        {tab === "segments" ? (
          <div className="admin-table-scroll">
            <p className="soft" style={{ marginTop: 0, maxWidth: "62ch", padding: "12px 14px 0" }}>
              Saved audiences with live member counts. Each campaign gets <strong>10</strong> branded
              emails you can edit anytime. Enroll in staggered batches — not blasts.
            </p>
            <div className="admin-engage-actions" style={{ marginBottom: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={Boolean(busy)}
                onClick={() => void aiCreateSegments()}
              >
                {busy === "segments" ? "Creating…" : "AI create segments"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={Boolean(busy) || segments.length === 0}
                onClick={() => void createCampaignsForAllSegments()}
              >
                {busy === "camps-all" ? "Creating…" : "Create campaigns for all segments"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={Boolean(busy)}
                onClick={() => void refreshSegments()}
              >
                Refresh counts
              </button>
            </div>
            {segments.length === 0 ? (
              <p className="muted">No segments yet — click “AI create segments” to generate them.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Rules</th>
                    <th>Members</th>
                    <th>Campaign</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s) => {
                    const linked = browse.campaigns.filter((c) => c.segmentKey === s.key);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div>{s.name}</div>
                          {s.description ? (
                            <div className="admin-cell-muted">{s.description}</div>
                          ) : null}
                        </td>
                        <td className="admin-cell-muted">{formatRules(s.rules)}</td>
                        <td>{s.memberCount.toLocaleString()}</td>
                        <td>
                          {linked.length ? (
                            <span>
                              {linked.map((c) => c.name).join(", ")}
                            </span>
                          ) : (
                            <span className="muted">None yet</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-engage-actions" style={{ margin: 0, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={Boolean(busy)}
                              onClick={() => void createCampaignForSegment(s.key)}
                            >
                              {busy === `camp-${s.key}` ? "Creating…" : "Create campaign"}
                            </button>
                            {linked[0] ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={Boolean(busy)}
                                onClick={() =>
                                  setSegmentEnroll({
                                    campaignKey: linked[0].key,
                                    campaignName: linked[0].name,
                                    segmentName: s.name,
                                    memberCount: s.memberCount,
                                  })
                                }
                              >
                                Enroll batch
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={Boolean(busy)}
                              onClick={() => void removeSegment(s.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        {tab === "sent" ? (
          <div className="admin-table-scroll">
            {browse.sends.length === 0 ? (
              <p className="muted">No sends yet.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Campaign</th>
                    <th>Step</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {browse.sends.map((s) => (
                    <tr key={s.id}>
                      <td>{s.email}</td>
                      <td>{s.campaignName}</td>
                      <td>{s.stepOrder + 1}</td>
                      <td>
                        {s.status}
                        {s.error ? <div className="admin-cell-muted">{s.error}</div> : null}
                      </td>
                      <td>
                        <RelativeTime iso={s.sentAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </section>

      <section className="card admin-panel">
        <div className="admin-panel-head">
          <h2>Email existing members</h2>
        </div>
        <p className="soft" style={{ marginTop: 0, maxWidth: "62ch" }}>
          Add free members who aren’t in the welcome campaign yet. First emails are spread over 7
          days so we don’t blast everyone at once — the cron sends what’s due every 15 minutes after
          deploy.
        </p>
        <div className="admin-engage-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(busy)}
            onClick={() => void openBulkEnrollDialog()}
          >
            {busy === "bulk" ? "Enrolling…" : "Enroll existing free members (batch)"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={Boolean(busy) || !mailReady}
            onClick={() => void tickDue()}
          >
            {busy === "tick" ? "Sending…" : "Send due emails now"}
          </button>
        </div>
      </section>

      <section className="card admin-panel">
        <div className="admin-panel-head">
          <h2>Try the welcome sequence</h2>
        </div>
        <p className="soft" style={{ marginTop: 0, maxWidth: "58ch" }}>
          Test on your own account first before enrolling everyone.
        </p>
        <label className="admin-engage-email">
          <span>Your test email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={Boolean(busy)}
          />
        </label>
        <div className="admin-engage-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={Boolean(busy) || !email.trim() || !mailReady}
            onClick={() => void tryWelcomeFlow()}
          >
            {busy === "flow" ? "Working…" : "Start sequence & send due emails"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={Boolean(busy)}
            onClick={() => void aiCreateSegments()}
          >
            {busy === "segments" ? "Creating…" : "AI create segments"}
          </button>
        </div>
      </section>

      <section className="card admin-panel">
        <div className="admin-panel-head">
          <h2>Contact auto-reply</h2>
        </div>
        <p className="soft" style={{ marginTop: 0, maxWidth: "58ch" }}>
          Instant “we got your message” after the contact form. Separate from welcome campaigns. See{" "}
          <Link href="/admin/support" style={{ color: "var(--brand)", fontWeight: 600 }}>
            Support
          </Link>{" "}
          for tickets.
        </p>
        {!status.autoresponderEnabled ? (
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Enable with <code>SUPPORT_AUTORESPONDER=1</code> in the deployment env.
          </p>
        ) : null}
        <form
          className="admin-support-test"
          onSubmit={(e) => {
            e.preventDefault();
            void sendAutoresponderTest();
          }}
        >
          <label>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Send a test reply to
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={Boolean(busy)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={Boolean(busy) || !status.autoresponderEnabled || !mailReady}
          >
            {busy === "ar" ? "Sending…" : "Send test reply"}
          </button>
        </form>
      </section>

      {segmentEnroll ? (
        <EnrollConfirmDialog
          open
          onClose={() => !busy && setSegmentEnroll(null)}
          onConfirm={submitSegmentEnroll}
          campaignName={segmentEnroll.campaignName}
          segmentName={segmentEnroll.segmentName}
          memberCount={segmentEnroll.memberCount}
          busy={Boolean(busy)}
        />
      ) : null}

      <EnrollConfirmDialog
        open={bulkEnrollOpen}
        onClose={() => !busy && setBulkEnrollOpen(false)}
        onConfirm={submitBulkEnroll}
        campaignName="Member activation"
        segmentName="Existing free members (not enrolled)"
        memberCount={bulkEligible}
        busy={busy === "bulk"}
      />
    </div>
  );
}

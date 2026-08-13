"use client";

import { useEffect, useMemo, useState } from "react";
import EmailRichEditor from "@/components/engagement/EmailRichEditor";
import EnrollConfirmDialog from "@/components/engagement/EnrollConfirmDialog";

export type CampaignEmail = {
  id: number;
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string | null;
  enabled: boolean;
  when: string;
};

export type CampaignRow = {
  id?: number;
  key: string;
  name: string;
  blurb: string;
  enabled?: boolean;
  segmentKey?: string | null;
  segmentName?: string | null;
  emailCount: number;
  emails: CampaignEmail[];
};

export type SegmentOption = { key: string; name: string; memberCount?: number };

type Props = {
  initialCampaigns: CampaignRow[];
  segments?: SegmentOption[];
  defaultEmail?: string;
  onChange?: (campaigns: CampaignRow[]) => void;
};

export default function EngagementCampaignsPanel({
  initialCampaigns,
  segments = [],
  defaultEmail = "",
  onChange,
}: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedKey, setSelectedKey] = useState(initialCampaigns[0]?.key || "");
  const [previewId, setPreviewId] = useState<number | null>(
    initialCampaigns[0]?.emails[0]?.id ?? null
  );

  // Keep panel in sync when parent reloads browse data
  useEffect(() => {
    setCampaigns(initialCampaigns);
    if (!initialCampaigns.find((c) => c.key === selectedKey)) {
      setSelectedKey(initialCampaigns[0]?.key || "");
      setPreviewId(initialCampaigns[0]?.emails[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when server data changes
  }, [initialCampaigns]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState(defaultEmail);

  const [editingCampaign, setEditingCampaign] = useState(false);
  const [campForm, setCampForm] = useState({ name: "", description: "", segmentKey: "" });
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [editingEmail, setEditingEmail] = useState(false);
  const [creatingEmail, setCreatingEmail] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    bodyHtml: "",
    delayDays: 0,
    enabled: true,
  });

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      if (a.key === "member_activation") return -1;
      if (b.key === "member_activation") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [campaigns]);

  const campaign = useMemo(
    () => sortedCampaigns.find((c) => c.key === selectedKey) || sortedCampaigns[0] || null,
    [sortedCampaigns, selectedKey]
  );
  const linkedSegmentMembers = useMemo(() => {
    if (!campaign?.segmentKey) return 0;
    return segments.find((s) => s.key === campaign.segmentKey)?.memberCount ?? 0;
  }, [campaign?.segmentKey, segments]);
  const preview = campaign?.emails.find((e) => e.id === previewId) || campaign?.emails[0] || null;

  function apply(next: CampaignRow[]) {
    setCampaigns(next);
    onChange?.(next);
  }

  async function reload() {
    const res = await fetch("/api/admin/engagement/campaigns");
    const data = (await res.json().catch(() => ({}))) as { campaigns?: CampaignRow[] };
    if (res.ok && data.campaigns) {
      apply(data.campaigns);
      if (!data.campaigns.find((c) => c.key === selectedKey) && data.campaigns[0]) {
        setSelectedKey(data.campaigns[0].key);
        setPreviewId(data.campaigns[0].emails[0]?.id ?? null);
      }
    }
  }

  async function createCampaign() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/engagement/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: campForm.name,
          description: campForm.description,
          segmentKey: campForm.segmentKey || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        campaign?: { campaign_key: string };
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t create campaign");
        return;
      }
      setCreatingCampaign(false);
      setCampForm({ name: "", description: "", segmentKey: "" });
      setMsg("Campaign created.");
      await reload();
      if (data.campaign?.campaign_key) setSelectedKey(data.campaign.campaign_key);
    } finally {
      setBusy(false);
    }
  }

  async function saveCampaign() {
    if (!campaign?.id) {
      setErr("This campaign can’t be edited yet — reload and try again.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/engagement/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: campForm.name,
          description: campForm.description,
          segmentKey: campForm.segmentKey || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t save campaign");
        return;
      }
      setEditingCampaign(false);
      setMsg("Campaign saved.");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  function openEdit(em: CampaignEmail) {
    setPreviewId(em.id);
    setCreatingEmail(false);
    setEditingEmail(true);
    setEmailForm({
      subject: em.subject,
      bodyHtml: em.bodyHtml || "",
      delayDays: em.delayDays,
      enabled: em.enabled,
    });
  }

  async function sendTestEmail() {
    if (!preview) return;
    const to = testEmail.trim();
    if (!to) {
      setErr("Enter an email address for the test send.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/engagement/emails/${preview.id}/send-test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: to }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        to?: string;
        subject?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t send test email");
        return;
      }
      setMsg(`Test sent to ${data.to || to} — subject: ${data.subject || preview.subject}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadStarterTemplates() {
    if (
      !confirm(
        "Replace Member activation with the 10-email feature tour?\n\nDashboard, profile, projects, quoting, QuoteCheck, credentials, documents, performance, plan, support. You can edit after."
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/engagement/emails/apply-templates", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        updated?: number;
        campaigns?: CampaignRow[];
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t load templates");
        return;
      }
      if (data.campaigns) apply(data.campaigns);
      else await reload();
      setMsg(`Loaded ${data.updated ?? 0} feature-tour emails — click one to tweak.`);
      const welcome = (data.campaigns || campaigns).find((c) => c.key === "member_activation");
      if (welcome?.emails[0]) {
        setSelectedKey(welcome.key);
        openEdit(welcome.emails[0]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function aiImproveEarlyCampaign() {
    if (
      !confirm(
        "AI-rewrite all 10 Member activation emails (feature tour)?\n\nKeeps Referrals logo + branding. You can edit after."
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/engagement/emails/ai-improve", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        touched?: number;
        ai?: boolean;
        aiConfigured?: boolean;
        campaigns?: CampaignRow[];
      };
      if (!res.ok) {
        setErr(data.error || "AI improve failed");
        return;
      }
      if (data.campaigns) apply(data.campaigns);
      else await reload();
      if (data.ai) {
        setMsg(`AI rewrote ${data.touched ?? 0} early campaign emails — review and send a test.`);
      } else if (data.aiConfigured === false) {
        setMsg(
          `Loaded polished defaults (${data.touched ?? 0}). Set ANTHROPIC_API_KEY for live AI rewrites.`
        );
      } else {
        setMsg(`Updated ${data.touched ?? 0} emails with polished fallbacks (AI parse missed).`);
      }
      const welcome = (data.campaigns || campaigns).find((c) => c.key === "member_activation");
      if (welcome?.emails[0]) {
        setSelectedKey(welcome.key);
        openEdit(welcome.emails[0]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitSegmentEnroll(opts: {
    limit: number;
    spreadDays: number;
    confirmEnroll?: string;
  }) {
    if (!campaign?.segmentKey) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/engagement/enroll-segment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignKey: campaign.key,
          limit: opts.limit,
          spreadDays: opts.spreadDays,
          confirmEnroll: opts.confirmEnroll,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setErr(data.error || "Couldn’t enroll segment");
        return;
      }
      setEnrollDialogOpen(false);
      setMsg(data.message || "Enrollment started.");
    } finally {
      setBusy(false);
    }
  }

  async function removeCampaign() {
    if (!campaign?.id) return;
    if (!confirm(`Delete campaign “${campaign.name}” and all its emails?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/engagement/campaigns/${campaign.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t delete campaign");
        return;
      }
      setMsg("Campaign deleted.");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function createEmail() {
    if (!campaign) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/engagement/emails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignKey: campaign.key,
          subject: emailForm.subject,
          bodyHtml: emailForm.bodyHtml,
          delayDays: emailForm.delayDays,
          enabled: emailForm.enabled,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; email?: { id: number } };
      if (!res.ok) {
        setErr(data.error || "Couldn’t create email");
        return;
      }
      setCreatingEmail(false);
      setEmailForm({ subject: "", bodyHtml: "", delayDays: 0, enabled: true });
      setMsg("Email added.");
      await reload();
      if (data.email?.id) setPreviewId(data.email.id);
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail() {
    if (!preview) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/engagement/emails/${preview.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: emailForm.subject,
          bodyHtml: emailForm.bodyHtml,
          delayDays: emailForm.delayDays,
          enabled: emailForm.enabled,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t save email");
        return;
      }
      setEditingEmail(false);
      setMsg("Email saved.");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function removeEmail() {
    if (!preview) return;
    if (!confirm(`Delete email “${preview.subject}”?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/engagement/emails/${preview.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Couldn’t delete email");
        return;
      }
      setMsg("Email deleted.");
      setPreviewId(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {(msg || err) && (
        <div className={err ? "admin-engage-banner err" : "admin-engage-banner ok"} role="status">
          {err || msg}
        </div>
      )}

      <div className="admin-engage-actions" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => {
            setCreatingCampaign(true);
            setEditingCampaign(false);
            setCampForm({ name: "", description: "", segmentKey: "" });
          }}
        >
          New campaign
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => void loadStarterTemplates()}
        >
          Load 10 feature emails
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => void aiImproveEarlyCampaign()}
        >
          {busy ? "Working…" : "AI improve 10 feature emails"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void reload()}>
          Reload
        </button>
      </div>

      {(creatingCampaign || editingCampaign) && (
        <div className="admin-engage-form card" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>
            {creatingCampaign ? "New campaign" : "Edit campaign"}
          </h3>
          <label className="admin-engage-email">
            <span>Name</span>
            <input
              value={campForm.name}
              onChange={(e) => setCampForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Welcome free members"
              disabled={busy}
            />
          </label>
          <label className="admin-engage-email" style={{ maxWidth: "100%" }}>
            <span>Description</span>
            <textarea
              className="admin-engage-textarea"
              rows={3}
              value={campForm.description}
              onChange={(e) => setCampForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What this sequence is for"
              disabled={busy}
            />
          </label>
          <label className="admin-engage-email">
            <span>Audience segment</span>
            <select
              value={campForm.segmentKey}
              onChange={(e) => setCampForm((f) => ({ ...f, segmentKey: e.target.value }))}
              disabled={busy}
            >
              <option value="">None (manual enroll only)</option>
              {segments.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                  {typeof s.memberCount === "number" ? ` (${s.memberCount.toLocaleString()})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-engage-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy || !campForm.name.trim()}
              onClick={() => void (creatingCampaign ? createCampaign() : saveCampaign())}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => {
                setCreatingCampaign(false);
                setEditingCampaign(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="admin-engage-browse">
        <aside className="admin-engage-campaign-list">
          {sortedCampaigns.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No campaigns yet. Create one.
            </p>
          ) : (
            sortedCampaigns.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`admin-engage-campaign-item${c.key === campaign?.key ? " active" : ""}`}
                onClick={() => {
                  setSelectedKey(c.key);
                  setPreviewId(c.emails[0]?.id ?? null);
                  setEditingEmail(false);
                  setCreatingEmail(false);
                }}
              >
                <strong>{c.name}</strong>
                <span className="muted">
                  {c.emailCount} email{c.emailCount === 1 ? "" : "s"}
                  {c.segmentName ? ` · ${c.segmentName}` : ""}
                  {c.enabled === false ? " · off" : ""}
                </span>
              </button>
            ))
          )}
        </aside>

        <div className="admin-engage-campaign-detail">
          {campaign ? (
            <>
              <div className="admin-panel-head" style={{ marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{campaign.name}</h3>
                <div className="admin-engage-actions" style={{ margin: 0 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busy}
                    onClick={() => {
                      setEditingCampaign(true);
                      setCreatingCampaign(false);
                      setCampForm({
                        name: campaign.name,
                        description: campaign.blurb || "",
                        segmentKey: campaign.segmentKey || "",
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busy || !campaign.id}
                    onClick={() => void removeCampaign()}
                  >
                    Delete
                  </button>
                  {campaign.segmentKey ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => {
                        if (!linkedSegmentMembers) {
                          setErr("This segment has no members to enroll.");
                          return;
                        }
                        setEnrollDialogOpen(true);
                      }}
                    >
                      Enroll segment
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy}
                    onClick={() => {
                      setCreatingEmail(true);
                      setEditingEmail(false);
                      setEmailForm({ subject: "", bodyHtml: "", delayDays: 0, enabled: true });
                    }}
                  >
                    Add email
                  </button>
                </div>
              </div>
              {campaign.segmentName ? (
                <p className="soft" style={{ margin: "0 0 8px", maxWidth: "52ch" }}>
                  Audience: <strong>{campaign.segmentName}</strong>
                </p>
              ) : null}
              {campaign.blurb ? (
                <p className="soft" style={{ margin: "0 0 14px", maxWidth: "52ch" }}>
                  {campaign.blurb}
                </p>
              ) : null}

              {campaign.emails.length === 0 && !creatingEmail ? (
                <p className="muted">No emails yet. Click Add email, or Load starter templates.</p>
              ) : (
                <div className="admin-engage-email-split">
                  <ul className="admin-engage-email-list">
                    {campaign.emails.map((em) => (
                      <li key={em.id}>
                        <button
                          type="button"
                          className={`admin-engage-email-item${em.id === preview?.id ? " active" : ""}`}
                          onClick={() => openEdit(em)}
                        >
                          <span className="admin-engage-when">{em.when}</span>
                          <strong>{em.subject}</strong>
                          {!em.enabled ? <span className="muted"> · off</span> : null}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {(creatingEmail || (editingEmail && preview)) && (
                    <div className="admin-engage-form admin-engage-preview">
                      <div className="admin-engage-preview-meta">
                        <span>{creatingEmail ? "New email" : "Edit template"}</span>
                        <div className="admin-engage-actions" style={{ margin: 0 }}>
                          {!creatingEmail && preview ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={busy}
                              onClick={() => void removeEmail()}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <label className="admin-engage-email">
                        <span>Subject</span>
                        <input
                          value={emailForm.subject}
                          onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                          placeholder="Welcome to Referrals, {{firstname}}"
                          disabled={busy}
                        />
                      </label>
                      <label className="admin-engage-email">
                        <span>Send after (days)</span>
                        <input
                          type="number"
                          min={0}
                          value={emailForm.delayDays}
                          onChange={(e) =>
                            setEmailForm((f) => ({ ...f, delayDays: Number(e.target.value) || 0 }))
                          }
                          disabled={busy}
                        />
                      </label>
                      <div className="admin-engage-email" style={{ maxWidth: "100%" }}>
                        <span>Email body</span>
                        <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.8rem" }}>
                          Tokens: {"{{firstname}}"}, {"{{siteName}}"}, {"{{siteUrl}}"}
                        </p>
                        <EmailRichEditor
                          key={creatingEmail ? "new-email" : `edit-${preview?.id ?? "x"}`}
                          content={emailForm.bodyHtml}
                          onChange={(html) => setEmailForm((f) => ({ ...f, bodyHtml: html }))}
                          placeholder="Write a personal email…"
                          minHeight={280}
                          disabled={busy}
                        />
                      </div>
                      <label className="admin-check" style={{ marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          checked={emailForm.enabled}
                          onChange={(e) => setEmailForm((f) => ({ ...f, enabled: e.target.checked }))}
                          disabled={busy}
                        />
                        Enabled
                      </label>
                      <div className="admin-engage-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busy || !emailForm.subject.trim()}
                          onClick={() => void (creatingEmail ? createEmail() : saveEmail())}
                        >
                          {busy ? "Saving…" : "Save template"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => {
                            setCreatingEmail(false);
                            setEditingEmail(false);
                          }}
                        >
                          Done
                        </button>
                      </div>
                      {!creatingEmail && preview ? (
                        <div className="admin-engage-test-send" style={{ marginTop: 8 }}>
                          <label className="admin-engage-email" style={{ marginBottom: 8 }}>
                            <span>Send test (uses last saved version)</span>
                            <input
                              type="email"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              placeholder="you@example.com"
                              disabled={busy}
                            />
                          </label>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={busy || !testEmail.trim()}
                            onClick={() => void sendTestEmail()}
                          >
                            {busy ? "Sending…" : "Send test"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {preview && !editingEmail && !creatingEmail ? (
                    <div className="admin-engage-preview">
                      <div className="admin-engage-preview-meta">
                        <span>
                          Preview · <strong style={{ color: "var(--ink)" }}>{preview.when}</strong>
                        </span>
                        <div className="admin-engage-actions" style={{ margin: 0 }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={busy}
                            onClick={() => openEdit(preview)}
                          >
                            Edit template
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={busy}
                            onClick={() => void removeEmail()}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h4>{preview.subject}</h4>
                      <div
                        className="admin-engage-preview-html"
                        dangerouslySetInnerHTML={{
                          __html: preview.bodyHtml || "<p class='muted'>No body</p>",
                        }}
                      />
                      <div className="admin-engage-test-send">
                        <label className="admin-engage-email" style={{ marginBottom: 8, maxWidth: "100%" }}>
                          <span>Send this template as a test</span>
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={busy}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busy || !testEmail.trim()}
                          onClick={() => void sendTestEmail()}
                        >
                          {busy ? "Sending…" : "Send test"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <p className="muted">Select or create a campaign.</p>
          )}
        </div>
      </div>

      {campaign?.segmentKey ? (
        <EnrollConfirmDialog
          open={enrollDialogOpen}
          onClose={() => !busy && setEnrollDialogOpen(false)}
          onConfirm={submitSegmentEnroll}
          campaignName={campaign.name}
          segmentName={campaign.segmentName || campaign.segmentKey}
          memberCount={linkedSegmentMembers}
          busy={busy}
        />
      ) : null}
    </div>
  );
}

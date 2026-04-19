"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SparklesIcon, LayoutTemplateIcon } from "lucide-react";
import { buildCampaignEmbedSnippets } from "@/lib/campaign-embed-snippets";
import { IntegrationEmbedSections } from "@/components/campaigns/integration-embed-sections";
import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";

export default function WidgetCustomizerPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;
  const cid = parseInt(campaignId, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");
  const [aiLoading, setAiLoading] = useState<null | "widget" | "bannerHtml">(null);
  const [vibe, setVibe] = useState("");

  const [formData, setFormData] = useState({
    header_title: "",
    description: "",
    button_text: "Join Now",
    color: "6366f1",
    button_color: "6366f1",
    text_color: "000000",
    background_color: "ffffff",
    background_type: "color",
    placement: "embed",
    success_message: "Thank you for joining!",
    field_label_1: "Full Name",
    field_label_2: "Email Address",
    body_text: "",
    stats_on: true,
  });

  useEffect(() => {
    setSiteOrigin(
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") ||
            "https://referrals.com"
    );
  }, []);

  const snippets = useMemo(
    () =>
      buildCampaignEmbedSnippets(
        siteOrigin || process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com",
        cid
      ),
    [siteOrigin, cid]
  );

  const iframePreviewUrl = `/widget/${campaignId}/embed`;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setCampaignName(String(data.name || ""));
        if (data.widget) {
          setFormData({
            header_title: data.widget.header_title || "",
            description: data.widget.description || "",
            button_text: data.widget.button_text || "Join Now",
            color: data.widget.color || "6366f1",
            button_color: data.widget.button_color || "6366f1",
            text_color: data.widget.text_color || "000000",
            background_color: data.widget.background_color || "ffffff",
            background_type: data.widget.background_type || "color",
            placement: data.widget.placement || "embed",
            success_message: data.widget.success_message || "",
            field_label_1: data.widget.field_label_1 || "Full Name",
            field_label_2: data.widget.field_label_2 || "Email Address",
            body_text: data.widget.body_text || "",
            stats_on: data.widget.stats_on ?? true,
          });
        }
      } catch {
        toast.error("Failed to load widget settings");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId]);

  function updateField(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget: formData }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("Widget settings saved");
    } catch {
      toast.error("Failed to save widget settings");
    } finally {
      setSaving(false);
    }
  }

  const callAiWidget = useCallback(async () => {
    setAiLoading("widget");
    try {
      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "widgetTheme",
          context: {
            campaignId,
            brandUrl: campaignName,
            vibe: vibe || "friendly, clear, modern",
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setFormData((prev) => ({
        ...prev,
        header_title: data.header_title ?? prev.header_title,
        description: data.description ?? prev.description,
        button_text: data.button_text ?? prev.button_text,
        success_message: data.success_message ?? prev.success_message,
        field_label_1: data.field_label_1 ?? prev.field_label_1,
        field_label_2: data.field_label_2 ?? prev.field_label_2,
        color: data.color ?? prev.color,
        button_color: data.button_color ?? prev.button_color,
        text_color: data.text_color ?? prev.text_color,
        background_color: data.background_color ?? prev.background_color,
        body_text: data.body_text != null ? String(data.body_text) : prev.body_text,
      }));
      toast.success("Widget draft updated — review and click Save to publish.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  }, [campaignId, campaignName, vibe]);

  const callAiBannerHtml = useCallback(async () => {
    setAiLoading("bannerHtml");
    try {
      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bannerHtml",
          context: {
            name: formData.header_title || campaignName || "Referral program",
            widgetDescription: formData.description,
            goalSummary: "",
            brandUrl: "",
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI request failed");
      const html = String(data.html || "");
      if (!html) throw new Error("No HTML returned");
      setFormData((prev) => ({ ...prev, body_text: html }));
      toast.success("HTML block added below the description in the preview.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  }, [campaignName, formData.description, formData.header_title]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading widget settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget studio</h1>
          <p className="mt-1 text-muted-foreground">
            Use AI to draft copy and colors, fine-tune fields, save — then copy install snippets below.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/brands/${brandId}/campaigns/${campaignId}`)}
        >
          Back to campaign
        </Button>
      </div>

      {/* AI + editor + preview */}
      <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 via-white to-rose-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SparklesIcon className="size-5 text-violet-600" />
            AI widget creator
          </CardTitle>
          <CardDescription>
            Generates a draft for this campaign (campaign id {cid}). Save when you are happy — the
            live embed iframe uses saved settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vibe">Optional tone / audience (one line)</Label>
            <Input
              id="vibe"
              placeholder="e.g. playful, crypto-native, enterprise trust"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!!aiLoading}
              onClick={() => void callAiWidget()}
              className="gap-2 bg-violet-600 text-white hover:bg-violet-700"
            >
              <SparklesIcon className="size-4" />
              {aiLoading === "widget" ? "Generating…" : "Generate copy & colors"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!aiLoading}
              onClick={() => void callAiBannerHtml()}
              className="gap-2"
            >
              <LayoutTemplateIcon className="size-4" />
              {aiLoading === "bannerHtml" ? "Designing…" : "Suggest HTML body"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header_title">Header title</Label>
                <Input
                  id="header_title"
                  value={formData.header_title}
                  onChange={(e) => updateField("header_title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_text">Body HTML</Label>
                <Textarea
                  id="body_text"
                  rows={3}
                  value={formData.body_text}
                  onChange={(e) => updateField("body_text", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_label_1">Field 1 label</Label>
                  <Input
                    id="field_label_1"
                    value={formData.field_label_1}
                    onChange={(e) => updateField("field_label_1", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_label_2">Field 2 label</Label>
                  <Input
                    id="field_label_2"
                    value={formData.field_label_2}
                    onChange={(e) => updateField("field_label_2", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_text">Button text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => updateField("button_text", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_message">Success message</Label>
                <Textarea
                  id="success_message"
                  rows={2}
                  value={formData.success_message}
                  onChange={(e) => updateField("success_message", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Primary color</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">#</span>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      maxLength={6}
                    />
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: `#${formData.color}` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_color">Button color</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">#</span>
                    <Input
                      id="button_color"
                      value={formData.button_color}
                      onChange={(e) => updateField("button_color", e.target.value)}
                      maxLength={6}
                    />
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: `#${formData.button_color}` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text_color">Text color</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">#</span>
                    <Input
                      id="text_color"
                      value={formData.text_color}
                      onChange={(e) => updateField("text_color", e.target.value)}
                      maxLength={6}
                    />
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: `#${formData.text_color}` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_color">Background color</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">#</span>
                    <Input
                      id="background_color"
                      value={formData.background_color}
                      onChange={(e) => updateField("background_color", e.target.value)}
                      maxLength={6}
                    />
                    <div
                      className="h-10 w-10 rounded border"
                      style={{
                        backgroundColor: `#${formData.background_color}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placement</Label>
                <Select
                  value={formData.placement}
                  onValueChange={(val: string | null) => updateField("placement", val || "")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="embed">Embed</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? "Saving…" : "Save widget settings"}
          </Button>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Live draft preview</CardTitle>
              <CardDescription>
                Reflects the form on the left. The real embed below uses saved settings after you
                click Save.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border p-5 shadow-inner"
                style={{
                  backgroundColor: `#${formData.background_color}`,
                  color: `#${formData.text_color}`,
                }}
              >
                <h2
                  className="text-xl font-bold"
                  style={{ color: `#${formData.color}` }}
                >
                  {formData.header_title || "Campaign title"}
                </h2>
                <p className="mt-2 text-sm opacity-90">
                  {formData.description || "Description appears here."}
                </p>
                {formData.body_text ? (
                  <div
                    className="prose prose-sm mt-3 max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeWidgetHtml(formData.body_text),
                    }}
                  />
                ) : null}

                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-xs font-medium">{formData.field_label_1}</span>
                    <div className="mt-1 rounded-md border bg-white/90 px-3 py-2 text-sm text-muted-foreground">
                      Sample name
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium">{formData.field_label_2}</span>
                    <div className="mt-1 rounded-md border bg-white/90 px-3 py-2 text-sm text-muted-foreground">
                      you@example.com
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: `#${formData.button_color}` }}
                  >
                    {formData.button_text || "Join now"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved widget embed</CardTitle>
              <CardDescription>iframe pointing at the live widget route (updates after Save).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <iframe
                src={iframePreviewUrl}
                className="min-h-[380px] w-full rounded-lg border bg-muted/30"
                title="Widget embed preview"
                allow="clipboard-write; clipboard-read"
              />
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-2 py-1.5 font-mono text-xs">
                  {snippets.iframe.split("\n")[0]}
                </div>
                <CopyToClipboardButton text={snippets.iframe} aria-label="Copy iframe code" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-2" />

      <section id="install" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add to your site</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-specific install steps and copy buttons. Placement (inline, popup, floating)
            still comes from the form above once saved.
          </p>
        </div>
        <IntegrationEmbedSections snippets={snippets} brandId={brandId} campaignId={cid} />
      </section>
    </div>
  );
}

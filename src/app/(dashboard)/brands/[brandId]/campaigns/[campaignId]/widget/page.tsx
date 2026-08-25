"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { toast } from "sonner";
import { SparklesIcon, LayoutTemplateIcon } from "lucide-react";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";
import { ImageInput } from "@/components/media/image-input";

export default function WidgetCustomizerPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;
  const cid = parseInt(campaignId, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [aiLoading, setAiLoading] = useState<null | "widget" | "bannerHtml">(
    null,
  );
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
    banner_image_url: "",
    background_image: "",
  });

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
            banner_image_url: data.widget.banner_image_url || "",
            background_image: data.widget.background_image || "",
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
        body_text:
          data.body_text != null ? String(data.body_text) : prev.body_text,
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

  const isPopup = formData.placement === "popup";

  // The widget exactly as a visitor sees it — reused for both embed & popup previews.
  const widgetCard = (
    <div
      className="w-full rounded-xl border border-black/5 p-5 shadow-lg"
      style={{
        backgroundColor: `#${formData.background_color}`,
        color: `#${formData.text_color}`,
      }}
    >
      <h3
        className="text-lg font-bold leading-snug"
        style={{ color: `#${formData.color}` }}
      >
        {formData.header_title || "Your headline goes here"}
      </h3>
      <p className="mt-1.5 text-sm opacity-80">
        {formData.description ||
          "A short line explaining the reward and why to join."}
      </p>
      {formData.body_text ? (
        <div
          className="prose prose-sm mt-3 max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizeWidgetHtml(formData.body_text),
          }}
        />
      ) : null}

      <div className="mt-4 space-y-3">
        <div>
          <span className="text-xs font-medium opacity-90">
            {formData.field_label_1 || "Full name"}
          </span>
          <div className="mt-1 rounded-md border border-black/10 bg-white/95 px-3 py-2 text-sm text-gray-400">
            Jane Doe
          </div>
        </div>
        <div>
          <span className="text-xs font-medium opacity-90">
            {formData.field_label_2 || "Email"}
          </span>
          <div className="mt-1 rounded-md border border-black/10 bg-white/95 px-3 py-2 text-sm text-gray-400">
            jane@example.com
          </div>
        </div>
        <button
          type="button"
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: `#${formData.button_color}` }}
        >
          {formData.button_text || "Join now"}
        </button>
      </div>

      {formData.stats_on ? (
        <p className="mt-3 text-center text-[11px] opacity-70">
          🎉 Join 1,200+ others already earning rewards
        </p>
      ) : null}
      <p className="mt-2 text-center text-[10px] opacity-50">
        Powered by Referrals.com
      </p>
    </div>
  );

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget studio</h1>
          <p className="mt-1 text-muted-foreground">
            Use AI to draft copy and colors, fine-tune fields, and save. All
            install and embed code lives in the{" "}
            <Link
              href={`/brands/${brandId}/campaigns/${campaignId}#integrations/iframe`}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              Integrations tab
            </Link>
            .
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/brands/${brandId}/campaigns/${campaignId}`)
          }
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
            Generates a draft for this campaign (campaign id {cid}). Save when
            you are happy — the live embed iframe uses saved settings.
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
              {aiLoading === "widget"
                ? "Generating…"
                : "Generate copy & colors"}
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

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="field_label_1">Field 1 label</Label>
                  <Input
                    id="field_label_1"
                    value={formData.field_label_1}
                    onChange={(e) =>
                      updateField("field_label_1", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_label_2">Field 2 label</Label>
                  <Input
                    id="field_label_2"
                    value={formData.field_label_2}
                    onChange={(e) =>
                      updateField("field_label_2", e.target.value)
                    }
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
                  onChange={(e) =>
                    updateField("success_message", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      onChange={(e) =>
                        updateField("button_color", e.target.value)
                      }
                      maxLength={6}
                    />
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: `#${formData.button_color}` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="text_color">Text color</Label>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">#</span>
                    <Input
                      id="text_color"
                      value={formData.text_color}
                      onChange={(e) =>
                        updateField("text_color", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("background_color", e.target.value)
                      }
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
                  onValueChange={(val: string | null) =>
                    updateField("placement", val || "")
                  }
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

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Add a banner and background. Generate a brand-aware banner with
                AI, upload, or paste a URL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Banner image</Label>
                <ImageInput
                  value={formData.banner_image_url}
                  onChange={(url) => updateField("banner_image_url", url)}
                  uploadType="banner"
                  ai={{
                    action: "campaignImage",
                    context: { campaignId },
                    maxRegenerations: 2,
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Background image</Label>
                <ImageInput
                  value={formData.background_image}
                  onChange={(url) => updateField("background_image", url)}
                  uploadType="widget"
                  previewClass="h-32"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? "Saving…" : "Save widget settings"}
          </Button>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Live preview</h2>
              <p className="text-sm text-muted-foreground">
                Exactly what visitors see. Updates as you type —{" "}
                <span className="font-medium text-foreground">Save</span> to
                publish.
              </p>
            </div>
            <span
              className="w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground"
              title="Change this under Styling → Placement"
            >
              {isPopup ? "Popup" : "Inline"} placement
            </span>
          </div>

          {/* Mock browser window showing the widget in context */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {/* browser chrome */}
            <div className="flex min-w-0 items-center gap-2 border-b bg-muted/40 px-3 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
              <div className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-muted-foreground">
                {(campaignName || "yourbrand.com")
                  .toLowerCase()
                  .replace(/\s+/g, "")}
                .com
              </div>
            </div>

            {/* faux page + widget */}
            <div className="relative bg-gradient-to-b from-gray-50 to-white p-4">
              {/* faux site content for context */}
              <div className={isPopup ? "pointer-events-none blur-[1px]" : ""}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="ml-auto flex gap-2">
                    <div className="h-3 w-10 rounded bg-gray-100" />
                    <div className="h-3 w-10 rounded bg-gray-100" />
                    <div className="h-3 w-10 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />

                {!isPopup && (
                  <div className="mx-auto mt-5 max-w-sm">{widgetCard}</div>
                )}

                {isPopup && (
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-5/6 rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                    <div className="h-24 w-full rounded bg-gray-100" />
                  </div>
                )}
              </div>

              {/* popup overlay */}
              {isPopup && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
                  <div className="relative w-full max-w-sm">
                    <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow">
                      ×
                    </span>
                    {widgetCard}
                  </div>
                </div>
              )}
            </div>
          </div>

          {formData.success_message ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <span className="font-semibold">After signup:</span>{" "}
              {formData.success_message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

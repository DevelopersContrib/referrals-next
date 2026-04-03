"use client";

import { useState, useEffect } from "react";
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

interface WidgetData {
  id: number;
  campaign_id: number;
  widget_type: string | null;
  color: string | null;
  header_title: string | null;
  description: string | null;
  button_text: string | null;
  button_color: string | null;
  text_color: string | null;
  background_color: string | null;
  background_type: string | null;
  placement: string | null;
  success_message: string | null;
  field_label_1: string | null;
  field_label_2: string | null;
  body_text: string | null;
  stats_on: boolean | null;
}

export default function WidgetCustomizerPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widget, setWidget] = useState<WidgetData | null>(null);

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
    async function fetchData() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        if (data.widget) {
          setWidget(data.widget);
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

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/widget/${campaignId}" width="100%" height="500" frameborder="0"></iframe>`;

  const scriptCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget/${campaignId}/embed.js" data-campaign="${campaignId}"></script>`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading widget settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget Customizer</h1>
          <p className="mt-1 text-muted-foreground">
            Customize the look and feel of your campaign widget
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/brands/${brandId}/campaigns/${campaignId}`)
          }
        >
          Back to Campaign
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header_title">Header Title</Label>
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
                <Label htmlFor="body_text">Body Text</Label>
                <Textarea
                  id="body_text"
                  rows={3}
                  value={formData.body_text}
                  onChange={(e) => updateField("body_text", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_label_1">Field 1 Label</Label>
                  <Input
                    id="field_label_1"
                    value={formData.field_label_1}
                    onChange={(e) =>
                      updateField("field_label_1", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_label_2">Field 2 Label</Label>
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
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => updateField("button_text", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_message">Success Message</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Primary Color</Label>
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
                  <Label htmlFor="button_color">Button Color</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
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
                  <Label htmlFor="background_color">Background Color</Label>
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

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Widget Settings"}
          </Button>
        </div>

        {/* Live Preview + Embed Code */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: `#${formData.background_color}`,
                  color: `#${formData.text_color}`,
                }}
              >
                <h2
                  className="text-xl font-bold"
                  style={{ color: `#${formData.color}` }}
                >
                  {formData.header_title || "Campaign Title"}
                </h2>
                <p className="mt-2 text-sm">
                  {formData.description || "Campaign description goes here..."}
                </p>
                {formData.body_text && (
                  <p className="mt-2 text-sm">{formData.body_text}</p>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium">
                      {formData.field_label_1 || "Full Name"}
                    </label>
                    <div className="mt-1 rounded border bg-white px-3 py-2 text-sm text-gray-400">
                      John Doe
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      {formData.field_label_2 || "Email Address"}
                    </label>
                    <div className="mt-1 rounded border bg-white px-3 py-2 text-sm text-gray-400">
                      john@example.com
                    </div>
                  </div>
                  <button
                    className="w-full rounded px-4 py-2 text-sm font-medium text-white"
                    style={{
                      backgroundColor: `#${formData.button_color}`,
                    }}
                  >
                    {formData.button_text || "Join Now"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy and paste this code into your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>iFrame Embed</Label>
                <Textarea
                  readOnly
                  rows={3}
                  value={embedCode}
                  className="font-mono text-xs"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
              <div className="space-y-2">
                <Label>Script Embed</Label>
                <Textarea
                  readOnly
                  rows={3}
                  value={scriptCode}
                  className="font-mono text-xs"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  toast.success("Embed code copied to clipboard");
                }}
              >
                Copy iFrame Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

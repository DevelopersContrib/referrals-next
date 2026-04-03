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

interface CampaignData {
  id: number;
  name: string;
  type_id: number;
  goal_type: string | null;
  num_visits: number | null;
  num_signups: number | null;
  reward_type: number;
  reward_notify_subject: string | null;
  reward_notify_message: string | null;
  campaign_entry_subject: string | null;
  campaign_entry_message: string | null;
  publish: string | null;
  allow_email: boolean | null;
  topbar_link: string | null;
  twoway_reward_notify_subject: string | null;
  twoway_reward_notify_message: string | null;
  typeName: string;
  rewardTypeName: string;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    goal_type: "signup",
    num_visits: "",
    num_signups: "",
    reward_notify_subject: "",
    reward_notify_message: "",
    campaign_entry_subject: "",
    campaign_entry_message: "",
    publish: "public",
    allow_email: false,
    topbar_link: "",
    twoway_reward_notify_subject: "",
    twoway_reward_notify_message: "",
  });

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to fetch campaign");

        const data: CampaignData = await response.json();
        setCampaign(data);
        setFormData({
          name: data.name || "",
          goal_type: data.goal_type || "signup",
          num_visits: data.num_visits?.toString() || "",
          num_signups: data.num_signups?.toString() || "",
          reward_notify_subject: data.reward_notify_subject || "",
          reward_notify_message: data.reward_notify_message || "",
          campaign_entry_subject: data.campaign_entry_subject || "",
          campaign_entry_message: data.campaign_entry_message || "",
          publish: data.publish || "public",
          allow_email: data.allow_email || false,
          topbar_link: data.topbar_link || "",
          twoway_reward_notify_subject:
            data.twoway_reward_notify_subject || "",
          twoway_reward_notify_message:
            data.twoway_reward_notify_message || "",
        });
      } catch {
        toast.error("Failed to load campaign");
        router.push(`/brands/${brandId}/campaigns`);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [campaignId, brandId, router]);

  function updateField(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }

      toast.success("Campaign updated successfully");
      router.push(`/brands/${brandId}/campaigns/${campaignId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update campaign"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Campaign deleted");
      router.push(`/brands/${brandId}/campaigns`);
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
          <p className="mt-1 text-muted-foreground">{campaign.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/brands/${brandId}/campaigns/${campaignId}`)
          }
        >
          Cancel
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={formData.publish}
                onValueChange={(val: string | null) => updateField("publish", val || "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topbar_link">Topbar Link</Label>
              <Input
                id="topbar_link"
                placeholder="https://..."
                value={formData.topbar_link}
                onChange={(e) => updateField("topbar_link", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Goal Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(val: string | null) => updateField("goal_type", val || "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visits</SelectItem>
                  <SelectItem value="signup">Signups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.goal_type === "visit" && (
              <div className="space-y-2">
                <Label htmlFor="num_visits">Number of Visits</Label>
                <Input
                  id="num_visits"
                  type="number"
                  min="1"
                  value={formData.num_visits}
                  onChange={(e) => updateField("num_visits", e.target.value)}
                />
              </div>
            )}

            {formData.goal_type === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="num_signups">Number of Signups</Label>
                <Input
                  id="num_signups"
                  type="number"
                  min="1"
                  value={formData.num_signups}
                  onChange={(e) => updateField("num_signups", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward_subject">Reward Email Subject</Label>
              <Input
                id="reward_subject"
                value={formData.reward_notify_subject}
                onChange={(e) =>
                  updateField("reward_notify_subject", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward_message">Reward Email Message</Label>
              <Textarea
                id="reward_message"
                rows={4}
                value={formData.reward_notify_message}
                onChange={(e) =>
                  updateField("reward_notify_message", e.target.value)
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="entry_subject">Entry Email Subject</Label>
              <Input
                id="entry_subject"
                value={formData.campaign_entry_subject}
                onChange={(e) =>
                  updateField("campaign_entry_subject", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_message">Entry Email Message</Label>
              <Textarea
                id="entry_message"
                rows={4}
                value={formData.campaign_entry_message}
                onChange={(e) =>
                  updateField("campaign_entry_message", e.target.value)
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="twoway_subject">
                Two-Way Reward Notification Subject
              </Label>
              <Input
                id="twoway_subject"
                value={formData.twoway_reward_notify_subject}
                onChange={(e) =>
                  updateField("twoway_reward_notify_subject", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twoway_message">
                Two-Way Reward Notification Message
              </Label>
              <Textarea
                id="twoway_message"
                rows={4}
                value={formData.twoway_reward_notify_message}
                onChange={(e) =>
                  updateField("twoway_reward_notify_message", e.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Campaign"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

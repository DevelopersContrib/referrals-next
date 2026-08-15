"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import {
  MapPinIcon,
  GiftIcon,
  Share2Icon,
  MonitorIcon,
  Rocket,
  CheckIcon,
  HelpCircle as HelpCircleIcon,
  Sparkles as SparklesIcon,
  Loader2 as Loader2Icon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageInput } from "@/components/media/image-input";
import { RewardConfigFields } from "@/components/campaigns/reward-config-fields";
import {
  buildRewardPayload,
  getRewardKind,
  parseCouponCodes,
  rewardFormValuesFromRecord,
  validateRewardConfig,
  type RewardFormValues,
} from "@/lib/reward-types";
import { buildCampaignEmbedSnippets } from "@/lib/campaign-embed-snippets";
import type { CampaignType, RewardType } from "@/components/campaigns/campaign-wizard";

function FieldHelp({ text }: { text: string }) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          tabIndex={-1}
          aria-label="Help"
          className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
        >
          <HelpCircleIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const STEPS = [
  { n: 1, title: "Campaign Type", desc: "Select campaign type", icon: MapPinIcon },
  { n: 2, title: "Reward", desc: "Setup reward for each successful referral", icon: GiftIcon },
  { n: 3, title: "Want to Share?", desc: "Configure what to share on social sites", icon: Share2Icon },
  { n: 4, title: "Widget Design", desc: "Customize widget or banner to be displayed on your site", icon: MonitorIcon },
  { n: 5, title: "Publish Campaign", desc: "Embed code to your site to receive referrals from visitor", icon: Rocket },
] as const;

export function CampaignCreateEditor({
  brandId,
  brandUrl,
  campaignTypes,
  rewardTypes,
  initialPublish = "private",
}: {
  brandId: string;
  brandUrl?: string | null;
  campaignTypes: CampaignType[];
  rewardTypes: RewardType[];
  initialPublish?: "public" | "private";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [shareAiLoading, setShareAiLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type_id: campaignTypes[0]?.id?.toString() || "",
    goal_type: "signup",
    num_visits: "100",
    num_signups: "50",
    reward_type: rewardTypes[0]?.id?.toString() || "",
    reward_notify_subject: "",
    reward_notify_message: "",
    campaign_entry_subject: "",
    campaign_entry_message: "",
    publish: initialPublish,
    topbar_link: "",
    twoway_reward_notify_subject: "",
    twoway_reward_notify_message: "",
  });
  const [social, setSocial] = useState({
    url: brandUrl || "",
    description: "",
    image_url: "",
  });
  const [email, setEmail] = useState({ subject: "", template: "" });
  const [rewardValues, setRewardValues] = useState<RewardFormValues>(
    rewardFormValuesFromRecord(null)
  );

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }
  function updateRewardField(field: keyof RewardFormValues, value: string) {
    setRewardValues((prev) => ({ ...prev, [field]: value }));
  }

  const selectedRewardType = rewardTypes.find(
    (t) => t.id.toString() === formData.reward_type
  );

  async function aiWriteEmails() {
    setAiLoading(true);
    try {
      const goalSummary =
        formData.goal_type === "visit"
          ? `${formData.num_visits || "a number of"} visits`
          : `${formData.num_signups || "a number of"} signups`;
      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "emails",
          context: {
            name: formData.name,
            goalSummary,
            rewardTypeName: selectedRewardType?.name,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI request failed");
      }
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        reward_notify_subject: data.reward_notify_subject || prev.reward_notify_subject,
        reward_notify_message: data.reward_notify_message || prev.reward_notify_message,
        campaign_entry_subject: data.campaign_entry_subject || prev.campaign_entry_subject,
        campaign_entry_message: data.campaign_entry_message || prev.campaign_entry_message,
      }));
      toast.success("AI drafted your reward & entry emails — review and tweak");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function aiWriteInvite() {
    setShareAiLoading(true);
    try {
      const goalSummary =
        formData.goal_type === "visit"
          ? `${formData.num_visits || "a number of"} visits`
          : `${formData.num_signups || "a number of"} signups`;
      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          context: {
            name: formData.name,
            goalSummary,
            rewardTypeName: selectedRewardType?.name,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI request failed");
      }
      const data = await res.json();
      setEmail((prev) => ({
        ...prev,
        subject: data.invite_subject || prev.subject,
        template: data.invite_message || prev.template,
      }));
      if (data.social_description) {
        setSocial((prev) => ({ ...prev, description: data.social_description }));
      }
      toast.success("AI drafted your invite email & social blurb — review and tweak");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setShareAiLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      setStep(2);
      return;
    }
    const kind = getRewardKind(selectedRewardType?.name);
    const rewardError = validateRewardConfig(kind, rewardValues, {
      requireCoupons: kind === "coupons",
    });
    if (rewardError) {
      toast.error(rewardError);
      setStep(2);
      return;
    }
    const newCoupons = parseCouponCodes(rewardValues.coupon_codes);

    setSaving(true);
    try {
      let campaignId = createdId;
      if (!campaignId) {
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            url_id: brandId,
            reward_type: formData.reward_type,
            reward: buildRewardPayload(kind, rewardValues),
            ...(newCoupons.length > 0 ? { coupons: newCoupons } : {}),
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create");
        }
        const created = await response.json();
        campaignId = created.id;
        setCreatedId(created.id);
      }

      await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reward_type: formData.reward_type,
          reward: buildRewardPayload(kind, rewardValues),
          socialContent: [
            { url: social.url, description: social.description, image_url: social.image_url },
          ],
          emailContent: [{ subject: email.subject, template: email.template }],
        }),
      });

      toast.success("Campaign created");
      router.push(`/brands/${brandId}/campaigns/${campaignId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  const embedSnippet = createdId
    ? buildCampaignEmbedSnippets(
        process.env.NEXT_PUBLIC_APP_URL || "https://referrals.com",
        createdId
      ).js
    : "";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-start justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = s.n < step;
          const current = s.n === step;
          return (
            <div key={s.n} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0 ? "opacity-0" : done || current ? "bg-brand" : "bg-border"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setStep(s.n)}
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    done
                      ? "border-brand bg-brand text-white"
                      : current
                        ? "border-brand bg-background text-brand ring-4 ring-brand/15"
                        : "border-border bg-background text-muted-foreground hover:border-brand/40"
                  )}
                >
                  {done ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </button>
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    i === STEPS.length - 1 ? "opacity-0" : done ? "bg-brand" : "bg-border"
                  )}
                />
              </div>
              <div className="mt-2 px-1">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    current ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.n}. {s.title}
                </div>
                <div className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Type</CardTitle>
            <CardDescription>Select the type of referral campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {campaignTypes.map((t) => {
                const active = formData.type_id === t.id.toString();
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateField("type_id", t.id.toString())}
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-colors",
                      active ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"
                    )}
                  >
                    <div className="font-medium">{t.name}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Goal Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Goal Type
                  <FieldHelp text="What a referred person must do for the referrer to earn the reward — visit the site, or sign up. Set the target count below." />
                </Label>
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

          <Card>
            <CardHeader>
              <CardTitle>Reward</CardTitle>
              <CardDescription>
                What participants receive when they hit the goal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Reward type
                  <FieldHelp text="What participants get when they hit the goal: a coupon code, a redirect URL, a custom thank-you message, cash, or tokens." />
                </Label>
                <Select
                  value={formData.reward_type}
                  onValueChange={(val: string | null) => updateField("reward_type", val || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type">
                      {(value: string | null) =>
                        rewardTypes.find((r) => r.id.toString() === value)?.name ??
                        "Select reward type"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <RewardConfigFields
                rewardTypeName={selectedRewardType?.name || ""}
                values={rewardValues}
                onChange={updateRewardField}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Reward Notifications</CardTitle>
                  <CardDescription>Email copy sent when rewards are earned</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={aiWriteEmails}
                  disabled={aiLoading}
                  className="shrink-0 gap-1.5"
                >
                  {aiLoading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="size-4 text-brand" />
                  )}
                  {aiLoading ? "Writing…" : "AI write emails"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward_subject">Reward Email Subject</Label>
                <Input
                  id="reward_subject"
                  value={formData.reward_notify_subject}
                  onChange={(e) => updateField("reward_notify_subject", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Email Message</Label>
                <RichTextEditor
                  ariaLabel="Reward email message"
                  value={formData.reward_notify_message || ""}
                  onChange={(html) => updateField("reward_notify_message", html)}
                  minHeight={140}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="entry_subject">Entry Email Subject</Label>
                <Input
                  id="entry_subject"
                  value={formData.campaign_entry_subject}
                  onChange={(e) => updateField("campaign_entry_subject", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Entry Email Message</Label>
                <RichTextEditor
                  ariaLabel="Entry email message"
                  value={formData.campaign_entry_message || ""}
                  onChange={(html) => updateField("campaign_entry_message", html)}
                  minHeight={140}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Share2Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#464457]">What participants share</p>
                <p className="text-xs text-muted-foreground">
                  Set up the social blurb and the invite email. Let AI draft it for you.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={aiWriteInvite}
              disabled={shareAiLoading}
              className="shrink-0 gap-1.5 border-brand/30 text-brand hover:bg-brand/10"
            >
              {shareAiLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              {shareAiLoading ? "Writing…" : "AI write share content"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Social Content</CardTitle>
              <CardDescription>
                What shows up when the campaign link is shared on social sites.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="share_url">URL To Share</Label>
                  <Input
                    id="share_url"
                    placeholder="https://..."
                    value={social.url}
                    onChange={(e) => setSocial((p) => ({ ...p, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="share_desc">Description</Label>
                  <Textarea
                    id="share_desc"
                    rows={3}
                    value={social.description}
                    onChange={(e) => setSocial((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campaign image</Label>
                  <ImageInput
                    value={social.image_url || ""}
                    onChange={(url) => setSocial((p) => ({ ...p, image_url: url }))}
                    uploadType="campaigns"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Preview</Label>
                <div className="overflow-hidden rounded-lg border border-[#ebeef0] bg-white">
                  {social.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={social.image_url}
                      alt="Share preview"
                      className="h-36 w-full bg-[#f7f8fa] object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-[#f7f8fa] text-xs text-muted-foreground">
                      No image set
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                      {social.url
                        ? social.url.replace(/^https?:\/\//, "").split("/")[0]
                        : "your-site.com"}
                    </p>
                    <p className="line-clamp-2 text-sm text-[#464457]">
                      {social.description || "Your share description will appear here."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite By Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email_subject">Email Subject</Label>
                <Input
                  id="email_subject"
                  value={email.subject}
                  onChange={(e) => setEmail((p) => ({ ...p, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Content</Label>
                <RichTextEditor
                  ariaLabel="Invite email content"
                  value={email.template || ""}
                  onChange={(html) => setEmail((p) => ({ ...p, template: html }))}
                  placeholders={["[name]", "[invited_by_name]", "[brand]", "[link]"]}
                  minHeight={200}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Widget Design</CardTitle>
            <CardDescription>Customize the widget or banner shown on your site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create the campaign first, then the full widget customizer (templates, colors, banner)
              opens — same as Edit Campaign.
            </p>
            {createdId ? (
              <Button variant="outline" render={<Link href={`/brands/${brandId}/campaigns/${createdId}/widget`} />}>
                Open Widget Customizer
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Use <strong>Create campaign</strong> below, then you can open the customizer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
          {createdId && embedSnippet ? (
            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <CardDescription>Paste this into your site to receive referrals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea readOnly rows={3} value={embedSnippet} className="font-mono text-xs" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              ← Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step < STEPS.length && (
            <Button variant="outline" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>
              Next →
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Creating..." : "Create campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CampaignWizardPreview } from "@/components/campaigns/campaign-wizard-preview";
import { CampaignIntegrationPanel } from "@/components/campaigns/campaign-integration-panel";
import { sanitizeWidgetHtml } from "@/lib/sanitize-widget-html";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SparklesIcon,
  ImageIcon,
  LayoutTemplateIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  TargetIcon,
  PaletteIcon,
  MailIcon,
  GiftIcon,
  RocketIcon,
} from "lucide-react";

interface CampaignType {
  id: number;
  name: string;
}

interface RewardType {
  id: number;
  name: string;
}

export interface CampaignWizardProps {
  brandId: string;
  brandUrl?: string | null;
  /** Used for /p/{slug}/campaign/{id} in the post-create integration panel */
  brandSlug?: string | null;
  /** Absolute site origin for embed snippets, e.g. https://referrals.com */
  embedBaseUrl: string;
  campaignTypes: CampaignType[];
  rewardTypes: RewardType[];
  /** Default visibility; unpaid members should use "private" so saves are not blocked by the API. */
  initialPublish?: "public" | "private";
}

interface FormData {
  name: string;
  type_id: string;
  goal_type: "visit" | "signup";
  num_visits: string;
  num_signups: string;
  reward_type: string;
  reward_notify_subject: string;
  reward_notify_message: string;
  campaign_entry_subject: string;
  campaign_entry_message: string;
  publish: "public" | "private";
  widget_description: string;
  widget_button_text: string;
  body_text: string;
  banner_image_url: string;
  widget_color: string;
  widget_button_color: string;
}

const STEPS = [
  { id: "basic", label: "Basics", hint: "Name your campaign and who can see it." },
  { id: "goal", label: "Goal", hint: "Pick what referrers must achieve to unlock rewards." },
  { id: "rewards", label: "Messages & design", hint: "Emails, widget copy, and optional AI banner." },
  {
    id: "review",
    label: "Review",
    hint: "Confirm details — then you’ll get install snippets for your site.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function CampaignWizard({
  brandId,
  brandUrl,
  brandSlug,
  embedBaseUrl,
  campaignTypes,
  rewardTypes,
  initialPublish = "private",
}: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>("basic");
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState<null | "emails" | "bannerHtml" | "bannerImage">(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    type_id: campaignTypes[0]?.id?.toString() || "1",
    goal_type: "signup",
    num_visits: "100",
    num_signups: "50",
    reward_type: rewardTypes[0]?.id?.toString() || "1",
    reward_notify_subject: "Congratulations! You earned a reward!",
    reward_notify_message:
      "Thank you for participating in our referral program. You have earned your reward!",
    campaign_entry_subject: "Welcome to our referral program!",
    campaign_entry_message:
      "Thank you for joining! Share your unique link with friends to earn rewards.",
    publish: initialPublish,
    widget_description:
      "Invite friends with your link. When they complete the goal, rewards unlock automatically.",
    widget_button_text: "Join now",
    body_text: "",
    banner_image_url: "",
    widget_color: "6366f1",
    widget_button_color: "6366f1",
  });

  const stepOrder: StepId[] = ["basic", "goal", "rewards", "review"];
  const currentIndex = stepOrder.indexOf(currentStep);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function goToNextStep() {
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }

  function goToPrevStep() {
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }

  function validateBasic() {
    if (!formData.name.trim()) {
      toast.error("Give your campaign a short, clear name (e.g. “Spring launch referrals”).");
      return false;
    }
    return true;
  }

  function validateGoal() {
    if (
      formData.goal_type === "visit" &&
      (!formData.num_visits || parseInt(formData.num_visits, 10) <= 0)
    ) {
      toast.error("Enter how many visits are needed before rewards trigger.");
      return false;
    }
    if (
      formData.goal_type === "signup" &&
      (!formData.num_signups || parseInt(formData.num_signups, 10) <= 0)
    ) {
      toast.error("Enter how many successful signups are needed for a reward.");
      return false;
    }
    return true;
  }

  function handleNextStep() {
    if (currentStep === "basic" && !validateBasic()) return;
    if (currentStep === "goal" && !validateGoal()) return;
    goToNextStep();
  }

  async function callAi(action: "emails" | "bannerHtml" | "bannerImage") {
    setAiLoading(action);
    try {
      const selectedReward = rewardTypes.find((r) => r.id.toString() === formData.reward_type);
      const goalSummary =
        formData.goal_type === "visit"
          ? `${formData.num_visits} referral visits`
          : `${formData.num_signups} referral signups`;

      const res = await fetch("/api/campaigns/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          context: {
            name: formData.name,
            brandUrl: brandUrl || "",
            goalSummary,
            rewardTypeName: selectedReward?.name || "",
            widgetDescription: formData.widget_description,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      if (action === "emails") {
        setFormData((prev) => ({
          ...prev,
          reward_notify_subject: data.reward_notify_subject || prev.reward_notify_subject,
          reward_notify_message: data.reward_notify_message || prev.reward_notify_message,
          campaign_entry_subject: data.campaign_entry_subject || prev.campaign_entry_subject,
          campaign_entry_message: data.campaign_entry_message || prev.campaign_entry_message,
        }));
        toast.success("Email copy updated — review and tweak as needed.");
      } else if (action === "bannerHtml") {
        const html = sanitizeWidgetHtml(String(data.html || ""));
        if (!html) throw new Error("No HTML returned");
        setFormData((prev) => ({ ...prev, body_text: html }));
        toast.success("HTML banner block added — check the preview.");
      } else if (action === "bannerImage") {
        const url = String(data.url || "");
        if (!url) throw new Error("No image URL");
        setFormData((prev) => ({ ...prev, banner_image_url: url }));
        toast.success("Hero image set — preview updates automatically.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          body_text: formData.body_text ? sanitizeWidgetHtml(formData.body_text) : "",
          url_id: brandId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg =
          error?.code === "REQUIRES_SUBSCRIPTION"
            ? `${error.error || "Subscription required"} Open Billing to choose a plan.`
            : error.error || "Failed to create campaign";
        throw new Error(msg);
      }

      const campaign = await response.json();
      const cid = Number(campaign.id);
      if (!Number.isFinite(cid)) throw new Error("Invalid campaign response");
      setCreatedCampaignId(cid);
      toast.success("Campaign saved — add the embed to your site below.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedType = campaignTypes.find((t) => t.id.toString() === formData.type_id);
  const selectedReward = rewardTypes.find((r) => r.id.toString() === formData.reward_type);

  if (createdCampaignId != null) {
    return (
      <div className="mx-auto max-w-6xl">
        <CampaignIntegrationPanel
          campaignId={createdCampaignId}
          brandId={brandId}
          baseUrl={embedBaseUrl}
          brandSlug={brandSlug}
          publicSegment={brandSlug?.trim() || brandId}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50/90 via-white to-rose-50/20 p-4 shadow-sm sm:p-6 md:p-8">
      {/* Step header */}
      <div className="mb-6 rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm sm:mb-8">
        <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {STEPS.map((s, i) => {
            const active = s.id === currentStep;
            const done = i < currentIndex;
            return (
              <li key={s.id} className="flex min-w-0 flex-1 items-start gap-2 sm:flex-initial">
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-brand text-white ring-2 ring-brand/30"
                      : done
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle2Icon className="size-5" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${active ? "text-slate-900" : "text-slate-600"}`}
                  >
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-500">{s.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,380px)]">
        <div className="min-w-0 space-y-6">
          {currentStep === "basic" && (
            <Card className="overflow-hidden border-sky-100/60 shadow-md">
              <CardHeader className="border-b border-sky-100/80 bg-gradient-to-r from-sky-50 via-white to-indigo-50/50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm">
                    <RocketIcon className="size-5" />
                  </span>
                  Campaign basics
                </CardTitle>
                <CardDescription>
                  Choose a name people recognize. Campaign type controls available features in the
                  dashboard later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-sm text-sky-900">
                  <strong className="font-semibold">Tip:</strong> use the same name you’ll use in
                  emails and social posts so participants trust the program.
                </div>
                <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Identity
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Spring launch — double rewards"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/40 to-violet-50/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Type & visibility
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="type">Campaign type</Label>
                    <Select
                      value={formData.type_id}
                      onValueChange={(val: string | null) => updateField("type_id", val || "")}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publish">Visibility</Label>
                    <Select
                      value={formData.publish}
                      onValueChange={(val) =>
                        updateField("publish", val as "public" | "private")
                      }
                    >
                      <SelectTrigger id="publish">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          Public — shareable link & widget (most common)
                        </SelectItem>
                        <SelectItem value="private">
                          Private — invite-only / testing
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleNextStep}>
                    Next: goal <ChevronRightIcon className="ml-1 size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "goal" && (
            <Card className="overflow-hidden border-amber-100/70 shadow-md">
              <CardHeader className="border-b border-amber-100/80 bg-gradient-to-r from-amber-50 via-white to-orange-50/40">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                    <TargetIcon className="size-5" />
                  </span>
                  Referral goal
                </CardTitle>
                <CardDescription>
                  This is the bar referrers must hit before rewards fire. You can tune numbers after
                  you see real traffic.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  <strong className="font-semibold">Visits</strong> count tracked link opens.{" "}
                  <strong className="font-semibold">Signups</strong> count completed registrations
                  from those links.
                </div>
                <div className="space-y-2">
                  <Label>Goal type</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(val) => updateField("goal_type", val as "visit" | "signup")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit">Visits — reward after N visits on referral links</SelectItem>
                      <SelectItem value="signup">
                        Signups — reward after N friends complete signup
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.goal_type === "visit" && (
                  <div className="space-y-2">
                    <Label htmlFor="num_visits">Visits required for reward</Label>
                    <Input
                      id="num_visits"
                      type="number"
                      min={1}
                      value={formData.num_visits}
                      onChange={(e) => updateField("num_visits", e.target.value)}
                    />
                  </div>
                )}

                {formData.goal_type === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="num_signups">Signups required for reward</Label>
                    <Input
                      id="num_signups"
                      type="number"
                      min={1}
                      value={formData.num_signups}
                      onChange={(e) => updateField("num_signups", e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={goToPrevStep}>
                    Back
                  </Button>
                  <Button onClick={handleNextStep}>
                    Next: messages &amp; design <ChevronRightIcon className="ml-1 size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "rewards" && (
            <Card className="overflow-hidden border-violet-100/70 shadow-md">
              <CardHeader className="border-b border-violet-100/80 bg-gradient-to-r from-violet-50 via-white to-rose-50/40">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
                    <PaletteIcon className="size-5" />
                  </span>
                  Messages, widget &amp; AI
                </CardTitle>
                <CardDescription>
                  Work through each tab — emails, on-site widget, then optional media. The live
                  preview updates as you type (desktop: right column; mobile: below).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="reward" className="space-y-5">
                  <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-slate-100/90 p-1.5">
                    <TabsTrigger value="reward" className="gap-1.5 text-xs sm:text-sm">
                      <GiftIcon className="size-3.5 opacity-70" />
                      Reward
                    </TabsTrigger>
                    <TabsTrigger value="emails" className="gap-1.5 text-xs sm:text-sm">
                      <MailIcon className="size-3.5 opacity-70" />
                      Emails
                    </TabsTrigger>
                    <TabsTrigger value="widget" className="gap-1.5 text-xs sm:text-sm">
                      <LayoutTemplateIcon className="size-3.5 opacity-70" />
                      Widget
                    </TabsTrigger>
                    <TabsTrigger value="media" className="gap-1.5 text-xs sm:text-sm">
                      <ImageIcon className="size-3.5 opacity-70" />
                      Media &amp; HTML
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reward" className="mt-0 space-y-4 rounded-xl border border-rose-100/80 bg-rose-50/25 p-4">
                    <p className="text-sm text-slate-600">
                      What participants receive when they hit the goal — drives fulfillment options
                      in the dashboard.
                    </p>
                    <div className="space-y-2">
                      <Label>Reward type</Label>
                      <Select
                        value={formData.reward_type}
                        onValueChange={(val: string | null) => updateField("reward_type", val || "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reward type" />
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
                  </TabsContent>

                  <TabsContent value="emails" className="mt-0 space-y-4 rounded-xl border border-violet-100/80 bg-violet-50/20 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-700">Transactional email copy</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-violet-200 bg-white text-violet-900 hover:bg-violet-50"
                        disabled={!!aiLoading}
                        onClick={() => void callAi("emails")}
                      >
                        <SparklesIcon className="size-4" />
                        {aiLoading === "emails" ? "Writing…" : "Suggest with AI"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reward_subject">Reward email subject</Label>
                      <Input
                        id="reward_subject"
                        value={formData.reward_notify_subject}
                        onChange={(e) => updateField("reward_notify_subject", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reward_message">Reward email body</Label>
                      <Textarea
                        id="reward_message"
                        rows={4}
                        value={formData.reward_notify_message}
                        onChange={(e) => updateField("reward_notify_message", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entry_subject">Welcome / entry email subject</Label>
                      <Input
                        id="entry_subject"
                        value={formData.campaign_entry_subject}
                        onChange={(e) => updateField("campaign_entry_subject", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entry_message">Welcome / entry email body</Label>
                      <Textarea
                        id="entry_message"
                        rows={4}
                        value={formData.campaign_entry_message}
                        onChange={(e) => updateField("campaign_entry_message", e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="widget" className="mt-0 space-y-4 rounded-xl border border-sky-100/80 bg-sky-50/20 p-4">
                    <p className="text-sm text-slate-600">
                      This is what visitors see in the embed — headline area, CTA, and brand colors.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="widget_desc">Short description under the title</Label>
                        <Textarea
                          id="widget_desc"
                          rows={3}
                          value={formData.widget_description}
                          onChange={(e) => updateField("widget_description", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="widget_btn">Primary button label</Label>
                        <Input
                          id="widget_btn"
                          value={formData.widget_button_text}
                          onChange={(e) => updateField("widget_button_text", e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Accent (#hex)</Label>
                            <Input
                              value={formData.widget_color}
                              onChange={(e) =>
                                updateField("widget_color", e.target.value.replace(/#/g, ""))
                              }
                              maxLength={6}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Button (#hex)</Label>
                            <Input
                              value={formData.widget_button_color}
                              onChange={(e) =>
                                updateField("widget_button_color", e.target.value.replace(/#/g, ""))
                              }
                              maxLength={6}
                              className="font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="mt-0 space-y-4 rounded-xl border border-amber-100/80 bg-amber-50/15 p-4">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Label htmlFor="banner_url">Hero image URL (optional)</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!!aiLoading}
                            onClick={() => void callAi("bannerImage")}
                          >
                            <ImageIcon className="size-4" />
                            {aiLoading === "bannerImage" ? "Generating…" : "AI hero image"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!!aiLoading}
                            onClick={() => void callAi("bannerHtml")}
                          >
                            <LayoutTemplateIcon className="size-4" />
                            {aiLoading === "bannerHtml" ? "Designing…" : "AI HTML banner"}
                          </Button>
                        </div>
                      </div>
                      <Input
                        id="banner_url"
                        placeholder="https://… (or use AI hero image)"
                        value={formData.banner_image_url}
                        onChange={(e) => updateField("banner_image_url", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Hero image shows above the title. HTML banner is rich content below the
                        description (sanitized on save).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body_html">Custom HTML block (optional)</Label>
                      <Textarea
                        id="body_html"
                        rows={6}
                        className="font-mono text-sm"
                        placeholder='<div style="padding:12px;background:#fef3c7;border-radius:8px">…</div>'
                        value={formData.body_text}
                        onChange={(e) => updateField("body_text", e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between border-t border-slate-100 pt-5">
                  <Button type="button" variant="outline" onClick={goToPrevStep}>
                    Back
                  </Button>
                  <Button onClick={handleNextStep}>
                    Review <ChevronRightIcon className="ml-1 size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "review" && (
            <Card className="overflow-hidden border-emerald-100/70 shadow-md">
              <CardHeader className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/40">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2Icon className="size-5" />
                  </span>
                  Review &amp; create
                </CardTitle>
                <CardDescription>
                  After you create, you&apos;ll get install snippets: JavaScript, iframe, Next.js,
                  WordPress, Shopify, Wix, PHP (CodeIgniter), React (CRA/Vite), Webflow, Squarespace,
                  and Google Tag Manager.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Campaign name</h3>
                  <p className="mt-1 text-lg font-semibold">{formData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                    <p className="mt-1">{selectedType?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Visibility</h3>
                    <Badge variant={formData.publish === "public" ? "default" : "secondary"}>
                      {formData.publish}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Goal</h3>
                    <p className="mt-1 capitalize">{formData.goal_type}s</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Target</h3>
                    <p className="mt-1">
                      {formData.goal_type === "visit"
                        ? `${formData.num_visits} visits`
                        : `${formData.num_signups} signups`}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Reward type</h3>
                  <p className="mt-1">{selectedReward?.name || "N/A"}</p>
                </div>

                <div className="lg:hidden">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Widget preview</h3>
                  <CampaignWizardPreview
                    name={formData.name}
                    description={formData.widget_description}
                    buttonText={formData.widget_button_text}
                    colorHex={formData.widget_color}
                    buttonColorHex={formData.widget_button_color}
                    bannerImageUrl={formData.banner_image_url}
                    bodyHtml={formData.body_text}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={goToPrevStep}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Creating…" : "Create campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
              Live preview
            </p>
            <CampaignWizardPreview
              name={formData.name}
              description={formData.widget_description}
              buttonText={formData.widget_button_text}
              colorHex={formData.widget_color}
              buttonColorHex={formData.widget_button_color}
              bannerImageUrl={formData.banner_image_url}
              bodyHtml={formData.body_text}
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Requires <code className="rounded bg-slate-100 px-1">OPENAI_API_KEY</code> for AI
              buttons. Preview works offline.
            </p>
          </div>
        </div>

        {/* Mobile preview for steps 1–3 */}
        {currentStep !== "review" && (
          <div className="lg:col-span-2 lg:hidden">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Widget preview
            </p>
            <CampaignWizardPreview
              name={formData.name}
              description={formData.widget_description}
              buttonText={formData.widget_button_text}
              colorHex={formData.widget_color}
              buttonColorHex={formData.widget_button_color}
              bannerImageUrl={formData.banner_image_url}
              bodyHtml={formData.body_text}
            />
          </div>
        )}
      </div>
    </div>
  );
}

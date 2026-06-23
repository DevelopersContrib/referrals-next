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
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  MapPinIcon,
  GiftIcon,
  Share2Icon,
  MonitorIcon,
  Rocket,
  CheckIcon,
} from "lucide-react";
import { RewardConfigFields } from "@/components/campaigns/reward-config-fields";
import {
  buildRewardPayload,
  getRewardKind,
  parseCouponCodes,
  rewardFormValuesFromRecord,
  validateRewardConfig,
  type RewardFormValues,
} from "@/lib/reward-types";

interface SocialContent {
  id?: number;
  url: string;
  description: string;
  image_url: string | null;
}
interface EmailContent {
  id?: number;
  subject: string;
  template: string | null;
}

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
  reward: {
    redirect_url?: string | null;
    custom_message?: string | null;
    cash_value?: number | null;
    worth_value?: number | null;
    token_symbol?: string | null;
    token_address?: string | null;
    token_amount?: string | null;
  } | null;
  rewardTypes: { id: number; name: string; has_value?: boolean }[];
  campaignTypes: { id: number; name: string }[];
  socialContent: SocialContent[];
  emailContent: EmailContent[];
  couponStats?: { total: number; available: number };
}

const STEPS = [
  { n: 1, title: "Campaign Type", desc: "Select campaign type", icon: MapPinIcon },
  { n: 2, title: "Reward", desc: "Setup reward for each successful referral", icon: GiftIcon },
  { n: 3, title: "Want to Share?", desc: "Configure what to share on social sites", icon: Share2Icon },
  { n: 4, title: "Widget Design", desc: "Customize widget or banner to be displayed on your site", icon: MonitorIcon },
  { n: 5, title: "Publish Campaign", desc: "Embed code to your site to receive referrals from visitor", icon: Rocket },
] as const;

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [rewardTypes, setRewardTypes] = useState<
    { id: number; name: string; has_value?: boolean }[]
  >([]);
  const [campaignTypes, setCampaignTypes] = useState<{ id: number; name: string }[]>([]);
  const [couponStats, setCouponStats] = useState({ total: 0, available: 0 });

  const [formData, setFormData] = useState({
    name: "",
    type_id: "",
    goal_type: "signup",
    num_visits: "",
    num_signups: "",
    reward_type: "",
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
  const [social, setSocial] = useState<SocialContent>({ url: "", description: "", image_url: "" });
  const [email, setEmail] = useState<EmailContent>({ subject: "", template: "" });
  const [rewardValues, setRewardValues] = useState<RewardFormValues>(
    rewardFormValuesFromRecord(null)
  );

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to fetch campaign");

        const data: CampaignData = await response.json();
        setCampaign(data);
        setRewardTypes(data.rewardTypes || []);
        setCampaignTypes(data.campaignTypes || []);
        setCouponStats(data.couponStats || { total: 0, available: 0 });
        setFormData({
          name: data.name || "",
          type_id: data.type_id?.toString() || "",
          goal_type: data.goal_type || "signup",
          num_visits: data.num_visits?.toString() || "",
          num_signups: data.num_signups?.toString() || "",
          reward_type: data.reward_type?.toString() || "",
          reward_notify_subject: data.reward_notify_subject || "",
          reward_notify_message: data.reward_notify_message || "",
          campaign_entry_subject: data.campaign_entry_subject || "",
          campaign_entry_message: data.campaign_entry_message || "",
          publish: data.publish || "public",
          allow_email: data.allow_email || false,
          topbar_link: data.topbar_link || "",
          twoway_reward_notify_subject: data.twoway_reward_notify_subject || "",
          twoway_reward_notify_message: data.twoway_reward_notify_message || "",
        });
        const sc = data.socialContent?.[0];
        if (sc) setSocial({ id: sc.id, url: sc.url || "", description: sc.description || "", image_url: sc.image_url || "" });
        const ec = data.emailContent?.[0];
        if (ec) setEmail({ id: ec.id, subject: ec.subject || "", template: ec.template || "" });
        const rv = rewardFormValuesFromRecord(data.reward);
        // Guard against legacy bad data where custom_message was stored as an object.
        if (rv.custom_message === "[object Object]") rv.custom_message = "";
        setRewardValues(rv);
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
  function updateRewardField(field: keyof RewardFormValues, value: string) {
    setRewardValues((prev) => ({ ...prev, [field]: value }));
  }

  const selectedRewardType = rewardTypes.find(
    (t) => t.id.toString() === formData.reward_type
  );

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      setStep(2);
      return;
    }
    const kind = getRewardKind(selectedRewardType?.name);
    const rewardError = validateRewardConfig(kind, rewardValues, {
      requireCoupons: kind === "coupons" && couponStats.total === 0,
    });
    if (rewardError) {
      toast.error(rewardError);
      setStep(2);
      return;
    }
    const newCoupons = parseCouponCodes(rewardValues.coupon_codes);

    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reward_type: formData.reward_type,
          reward: buildRewardPayload(kind, rewardValues),
          socialContent: [{ id: social.id, url: social.url, description: social.description, image_url: social.image_url }],
          emailContent: [{ id: email.id, subject: email.subject, template: email.template }],
          ...(newCoupons.length > 0 ? { coupons: newCoupons } : {}),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update");
      }
      toast.success("Campaign updated successfully");
      router.push(`/brands/${brandId}/campaigns/${campaignId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
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

  const embedSnippet = `<script src="https://www.referrals.com/api/widget/js/${campaignId}" async></script>`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
          <p className="mt-1 text-muted-foreground">{campaign.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/brands/${brandId}/campaigns/${campaignId}`)}
        >
          Cancel
        </Button>
      </div>

      {/* Wizard stepper */}
      <div className="mb-8 flex items-start justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = s.n < step;
          const current = s.n === step;
          return (
            <div key={s.n} className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done || current ? "bg-brand" : "bg-border")} />
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
                <div className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : done ? "bg-brand" : "bg-border")} />
              </div>
              <div className="mt-2 px-1">
                <div className={cn("text-sm font-semibold", current ? "text-foreground" : "text-muted-foreground")}>
                  {s.n}. {s.title}
                </div>
                <div className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1 — Campaign Type */}
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

      {/* Step 2 — Reward */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topbar_link">Topbar Link</Label>
                <Input id="topbar_link" placeholder="https://..." value={formData.topbar_link} onChange={(e) => updateField("topbar_link", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Goal Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={formData.goal_type} onValueChange={(val: string | null) => updateField("goal_type", val || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visit">Visits</SelectItem>
                    <SelectItem value="signup">Signups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.goal_type === "visit" && (
                <div className="space-y-2">
                  <Label htmlFor="num_visits">Number of Visits</Label>
                  <Input id="num_visits" type="number" min="1" value={formData.num_visits} onChange={(e) => updateField("num_visits", e.target.value)} />
                </div>
              )}
              {formData.goal_type === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="num_signups">Number of Signups</Label>
                  <Input id="num_signups" type="number" min="1" value={formData.num_signups} onChange={(e) => updateField("num_signups", e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward</CardTitle>
              <CardDescription>
                What participants receive when they hit the goal. Coupon codes are stored separately and appended when you add new lines below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reward type</Label>
                <Select value={formData.reward_type} onValueChange={(val: string | null) => updateField("reward_type", val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type">
                      {(value: string | null) => rewardTypes.find((r) => r.id.toString() === value)?.name ?? "Select reward type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <RewardConfigFields
                rewardTypeName={selectedRewardType?.name || ""}
                values={rewardValues}
                onChange={updateRewardField}
                couponStats={couponStats}
              />
              {getRewardKind(selectedRewardType?.name) === "coupons" && couponStats.total > 0 && (
                <p className="text-sm">
                  <Link href={`/brands/${brandId}/campaigns/${campaignId}/rewards`} className="text-brand underline-offset-4 hover:underline">
                    View all coupons
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward Notifications</CardTitle>
              <CardDescription>Email copy sent when rewards are earned</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward_subject">Reward Email Subject</Label>
                <Input id="reward_subject" value={formData.reward_notify_subject} onChange={(e) => updateField("reward_notify_subject", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward_message">Reward Email Message</Label>
                <Textarea id="reward_message" rows={4} value={formData.reward_notify_message} onChange={(e) => updateField("reward_notify_message", e.target.value)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="entry_subject">Entry Email Subject</Label>
                <Input id="entry_subject" value={formData.campaign_entry_subject} onChange={(e) => updateField("campaign_entry_subject", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry_message">Entry Email Message</Label>
                <Textarea id="entry_message" rows={4} value={formData.campaign_entry_message} onChange={(e) => updateField("campaign_entry_message", e.target.value)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="twoway_subject">Two-Way Reward Notification Subject</Label>
                <Input id="twoway_subject" value={formData.twoway_reward_notify_subject} onChange={(e) => updateField("twoway_reward_notify_subject", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twoway_message">Two-Way Reward Notification Message</Label>
                <Textarea id="twoway_message" rows={4} value={formData.twoway_reward_notify_message} onChange={(e) => updateField("twoway_reward_notify_message", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3 — Want to Share? */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Content</CardTitle>
              <CardDescription>Configure what gets shared on social sites.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share_url">URL To Share *</Label>
                <Input id="share_url" placeholder="https://..." value={social.url} onChange={(e) => setSocial((p) => ({ ...p, url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share_desc">Description</Label>
                <Textarea id="share_desc" rows={3} value={social.description} onChange={(e) => setSocial((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share_img">Image URL</Label>
                <Input id="share_img" placeholder="https://.../image.png" value={social.image_url || ""} onChange={(e) => setSocial((p) => ({ ...p, image_url: e.target.value }))} />
                {social.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={social.image_url} alt="Share preview" className="mt-2 h-24 w-auto rounded border object-cover" />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite By Email Content</CardTitle>
              <CardDescription>
                Placeholders: <code>[name]</code>, <code>[invited_by_name]</code>, <code>[brand]</code>, <code>[link]</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email_subject">Email Subject</Label>
                <Input id="email_subject" value={email.subject} onChange={(e) => setEmail((p) => ({ ...p, subject: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_template">Email Content</Label>
                <Textarea id="email_template" rows={8} value={email.template || ""} onChange={(e) => setEmail((p) => ({ ...p, template: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 — Widget Design */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Widget Design</CardTitle>
            <CardDescription>Customize the widget or banner shown on your site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The widget customizer (templates, colors, banner) opens in the full editor.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/brands/${brandId}/campaigns/${campaignId}/widget`)}
            >
              Open Widget Customizer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 5 — Publish Campaign */}
      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={formData.publish} onValueChange={(val: string | null) => updateField("publish", val || "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Paste this into your site to receive referrals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea readOnly rows={3} value={embedSnippet} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { navigator.clipboard.writeText(embedSnippet); toast.success("Embed code copied"); }}
              >
                Copy Embed Code
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer nav + actions */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Campaign"}
          </Button>
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
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CampaignType {
  id: number;
  name: string;
}

interface RewardType {
  id: number;
  name: string;
}

interface CampaignWizardProps {
  brandId: string;
  campaignTypes: CampaignType[];
  rewardTypes: RewardType[];
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
}

export function CampaignWizard({
  brandId,
  campaignTypes,
  rewardTypes,
}: CampaignWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    publish: "public",
  });

  const steps = [
    { id: "basic", label: "Basic Info", number: 1 },
    { id: "goal", label: "Goal", number: 2 },
    { id: "rewards", label: "Rewards", number: 3 },
    { id: "review", label: "Review & Create", number: 4 },
  ];

  const stepOrder = ["basic", "goal", "rewards", "review"];

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function goToNextStep() {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  }

  function goToPrevStep() {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }

  function validateBasic() {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return false;
    }
    return true;
  }

  function validateGoal() {
    if (
      formData.goal_type === "visit" &&
      (!formData.num_visits || parseInt(formData.num_visits) <= 0)
    ) {
      toast.error("Please enter a valid number of visits");
      return false;
    }
    if (
      formData.goal_type === "signup" &&
      (!formData.num_signups || parseInt(formData.num_signups) <= 0)
    ) {
      toast.error("Please enter a valid number of signups");
      return false;
    }
    return true;
  }

  function handleNextStep() {
    if (currentStep === "basic" && !validateBasic()) return;
    if (currentStep === "goal" && !validateGoal()) return;
    goToNextStep();
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          url_id: brandId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const campaign = await response.json();
      toast.success("Campaign created successfully!");
      router.push(`/brands/${brandId}/campaigns/${campaign.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedType = campaignTypes.find(
    (t) => t.id.toString() === formData.type_id
  );
  const selectedReward = rewardTypes.find(
    (r) => r.id.toString() === formData.reward_type
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Tabs value={currentStep} onValueChange={(v: string | null) => setCurrentStep(v || "")}>
        <TabsList className="grid w-full grid-cols-4">
          {steps.map((step) => (
            <TabsTrigger key={step.id} value={step.id}>
              <span className="mr-2 hidden sm:inline">{step.number}.</span>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Basic Info */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the fundamentals of your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Summer Referral Program"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(val: string | null) => updateField("type_id", val || "")}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNextStep}>Next: Set Goal</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Goal */}
        <TabsContent value="goal">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Goal</CardTitle>
              <CardDescription>
                Define what success looks like for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(val) =>
                    updateField("goal_type", val as "visit" | "signup")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visit">
                      Visits - Reward after referral visits
                    </SelectItem>
                    <SelectItem value="signup">
                      Signups - Reward after referral signups
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.goal_type === "visit" && (
                <div className="space-y-2">
                  <Label htmlFor="num_visits">
                    Number of Visits to Earn Reward
                  </Label>
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
                  <Label htmlFor="num_signups">
                    Number of Signups to Earn Reward
                  </Label>
                  <Input
                    id="num_signups"
                    type="number"
                    min="1"
                    value={formData.num_signups}
                    onChange={(e) => updateField("num_signups", e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>
                <Button onClick={handleNextStep}>Next: Rewards</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Rewards */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Reward Settings</CardTitle>
              <CardDescription>
                Configure rewards for successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Reward Type</Label>
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

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="reward_subject">
                  Reward Notification Subject
                </Label>
                <Input
                  id="reward_subject"
                  value={formData.reward_notify_subject}
                  onChange={(e) =>
                    updateField("reward_notify_subject", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward_message">
                  Reward Notification Message
                </Label>
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

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>
                <Button onClick={handleNextStep}>Next: Review</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Review */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>
                Review your campaign details before creating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Campaign Name
                </h3>
                <p className="mt-1 text-lg font-semibold">{formData.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Type
                  </h3>
                  <p className="mt-1">{selectedType?.name || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Visibility
                  </h3>
                  <Badge
                    variant={
                      formData.publish === "public" ? "default" : "secondary"
                    }
                  >
                    {formData.publish}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Goal Type
                  </h3>
                  <p className="mt-1 capitalize">{formData.goal_type}s</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Target
                  </h3>
                  <p className="mt-1">
                    {formData.goal_type === "visit"
                      ? `${formData.num_visits} visits`
                      : `${formData.num_signups} signups`}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Reward Type
                </h3>
                <p className="mt-1">{selectedReward?.name || "N/A"}</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

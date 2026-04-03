"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface EmailTemplate {
  id?: number;
  campaign_id: number;
  subject: string;
  template: string;
}

export default function EmailsPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brandId as string;
  const campaignId = params.campaignId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [entrySubject, setEntrySubject] = useState("");
  const [entryMessage, setEntryMessage] = useState("");
  const [rewardSubject, setRewardSubject] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");
  const [twowaySubject, setTwowaySubject] = useState("");
  const [twowayMessage, setTwowayMessage] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setEntrySubject(data.campaign_entry_subject || "");
        setEntryMessage(data.campaign_entry_message || "");
        setRewardSubject(data.reward_notify_subject || "");
        setRewardMessage(data.reward_notify_message || "");
        setTwowaySubject(data.twoway_reward_notify_subject || "");
        setTwowayMessage(data.twoway_reward_notify_message || "");
        setEmailTemplates(data.emailContent || []);
      } catch {
        toast.error("Failed to load email settings");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignId]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_entry_subject: entrySubject,
          campaign_entry_message: entryMessage,
          reward_notify_subject: rewardSubject,
          reward_notify_message: rewardMessage,
          twoway_reward_notify_subject: twowaySubject,
          twoway_reward_notify_message: twowayMessage,
          emailContent: emailTemplates,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("Email templates saved successfully");
    } catch {
      toast.error("Failed to save email templates");
    } finally {
      setSaving(false);
    }
  }

  function updateTemplate(index: number, field: string, value: string) {
    setEmailTemplates((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function addTemplate() {
    setEmailTemplates((prev) => [
      ...prev,
      {
        campaign_id: parseInt(campaignId, 10),
        subject: "",
        template: "",
      },
    ]);
  }

  function removeTemplate(index: number) {
    setEmailTemplates((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading email settings...</p>
      </div>
    );
  }

  const placeholders = [
    { tag: "{{name}}", desc: "Participant name" },
    { tag: "{{email}}", desc: "Participant email" },
    { tag: "{{referral_url}}", desc: "Unique referral link" },
    { tag: "{{campaign_name}}", desc: "Campaign name" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Customize emails sent to participants
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="entry">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="entry">Entry Email</TabsTrigger>
              <TabsTrigger value="reward">Reward Email</TabsTrigger>
              <TabsTrigger value="twoway">Two-Way Reward</TabsTrigger>
            </TabsList>

            {/* Entry Email */}
            <TabsContent value="entry">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Entry Email</CardTitle>
                  <CardDescription>
                    Sent when someone joins your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry_subject">Subject</Label>
                    <Input
                      id="entry_subject"
                      value={entrySubject}
                      onChange={(e) => setEntrySubject(e.target.value)}
                      placeholder="Welcome to our referral program!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry_message">Message</Label>
                    <Textarea
                      id="entry_message"
                      rows={10}
                      value={entryMessage}
                      onChange={(e) => setEntryMessage(e.target.value)}
                      placeholder="Thank you for joining! Share your unique link..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reward Notification */}
            <TabsContent value="reward">
              <Card>
                <CardHeader>
                  <CardTitle>Reward Notification Email</CardTitle>
                  <CardDescription>
                    Sent when a participant earns a reward
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reward_subject">Subject</Label>
                    <Input
                      id="reward_subject"
                      value={rewardSubject}
                      onChange={(e) => setRewardSubject(e.target.value)}
                      placeholder="Congratulations! You earned a reward!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward_message">Message</Label>
                    <Textarea
                      id="reward_message"
                      rows={10}
                      value={rewardMessage}
                      onChange={(e) => setRewardMessage(e.target.value)}
                      placeholder="You've reached the referral goal..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Two-Way Reward */}
            <TabsContent value="twoway">
              <Card>
                <CardHeader>
                  <CardTitle>Two-Way Reward Email</CardTitle>
                  <CardDescription>
                    Sent to the referred person when they also earn a reward
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twoway_subject">Subject</Label>
                    <Input
                      id="twoway_subject"
                      value={twowaySubject}
                      onChange={(e) => setTwowaySubject(e.target.value)}
                      placeholder="You've been rewarded too!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twoway_message">Message</Label>
                    <Textarea
                      id="twoway_message"
                      rows={10}
                      value={twowayMessage}
                      onChange={(e) => setTwowayMessage(e.target.value)}
                      placeholder="Thanks to your friend's referral..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Custom Email Templates */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Email Templates</CardTitle>
                  <CardDescription>
                    Additional email templates for this campaign
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addTemplate}>
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom templates. Click &quot;Add Template&quot; to create
                  one.
                </p>
              ) : (
                <div className="space-y-6">
                  {emailTemplates.map((template, index) => (
                    <div key={index} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <Label>Template {index + 1}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTemplate(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          value={template.subject}
                          onChange={(e) =>
                            updateTemplate(index, "subject", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          rows={6}
                          value={template.template || ""}
                          onChange={(e) =>
                            updateTemplate(index, "template", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save All Email Templates"}
            </Button>
          </div>
        </div>

        {/* Placeholders Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Template Placeholders</CardTitle>
              <CardDescription>
                Use these in your email messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholders.map((p) => (
                  <div key={p.tag}>
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                      {p.tag}
                    </code>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

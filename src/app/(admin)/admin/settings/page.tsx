"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PlatformSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  defaultPlanId: number;
  supportEmail: string;
  maxBrandsPerMember: number;
  maxCampaignsPerBrand: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: "Referrals.com",
    maintenanceMode: false,
    registrationEnabled: true,
    defaultPlanId: 0,
    supportEmail: "support@referrals.com",
    maxBrandsPerMember: 10,
    maxCampaignsPerBrand: 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSuccess("Settings saved successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Platform Settings</h1>
      <p className="text-muted-foreground">
        Configure global platform settings.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) =>
                  setSettings({ ...settings, supportEmail: e.target.value })
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Feature Toggles</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maintenanceMode: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="maintenanceMode">
                  Maintenance Mode
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Disables public access)
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="registrationEnabled"
                  checked={settings.registrationEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registrationEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="registrationEnabled">
                  Registration Enabled
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Allow new signups)
                  </span>
                </Label>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultPlanId">Default Plan ID</Label>
                <Input
                  id="defaultPlanId"
                  type="number"
                  value={settings.defaultPlanId}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultPlanId: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxBrandsPerMember">
                  Max Brands per Member
                </Label>
                <Input
                  id="maxBrandsPerMember"
                  type="number"
                  value={settings.maxBrandsPerMember}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxBrandsPerMember: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="maxCampaignsPerBrand">
                Max Campaigns per Brand
              </Label>
              <Input
                id="maxCampaignsPerBrand"
                type="number"
                value={settings.maxCampaignsPerBrand}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxCampaignsPerBrand: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="max-w-48"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

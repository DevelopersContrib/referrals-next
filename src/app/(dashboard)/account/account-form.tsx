"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  KeyIcon,
  ShieldIcon,
  Trash2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
  SaveIcon,
  Loader2Icon,
} from "lucide-react";

export function AccountForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setProfileError(data.error || "Failed to update profile.");
      } else {
        setProfileSuccess("Profile updated successfully.");
      }
    } catch {
      setProfileError("Something went wrong.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to update password.");
      } else {
        setPasswordSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <Tabs defaultValue="profile">
      <TabsList variant="line" className="border-b border-[#ebeef0] pb-0 mb-6">
        <TabsTrigger value="profile" className="gap-1.5">
          <UserIcon className="size-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="api" className="gap-1.5">
          <KeyIcon className="size-4" />
          API Settings
        </TabsTrigger>
        <TabsTrigger value="password" className="gap-1.5">
          <ShieldIcon className="size-4" />
          Password
        </TabsTrigger>
        <TabsTrigger value="delete" className="gap-1.5 text-[#dc3545]">
          <Trash2Icon className="size-4" />
          Delete
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <div className="portlet">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#575962]">
              Profile Information
            </h3>
            <p className="mt-0.5 text-sm text-[#a7abc3]">
              Update your account name and email address.
            </p>
          </div>

          {profileSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#28a745]/20 bg-[#28a745]/5 p-3 text-sm text-[#28a745]">
              <CheckCircleIcon className="size-4 shrink-0" />
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#dc3545]/20 bg-[#dc3545]/5 p-3 text-sm text-[#dc3545]">
              <AlertCircleIcon className="size-4 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-bold uppercase tracking-wider text-[#a7abc3]"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-[#ebeef0] bg-[#f7f8fa] focus:border-brand focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-[#a7abc3]"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#ebeef0] bg-[#f7f8fa] focus:border-brand focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-[#ebeef0] pt-4">
              <Button
                type="submit"
                disabled={profileLoading}
                className="gap-2 bg-brand text-white hover:bg-brand-hover"
              >
                {profileLoading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                {profileLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>

      {/* API Settings Tab */}
      <TabsContent value="api">
        <div className="portlet">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#575962]">
              API Settings
            </h3>
            <p className="mt-0.5 text-sm text-[#a7abc3]">
              Manage your API keys and webhook configuration.
            </p>
          </div>
          <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 text-center">
            <KeyIcon className="mx-auto size-10 text-brand/40" />
            <p className="mt-2 text-sm text-[#575962]">
              Manage your API keys on the dedicated page.
            </p>
            <a href="/api-keys">
              <Button
                size="sm"
                className="mt-3 gap-1 bg-brand text-white hover:bg-brand-hover"
              >
                Go to API Keys
              </Button>
            </a>
          </div>
        </div>
      </TabsContent>

      {/* Password Tab */}
      <TabsContent value="password">
        <div className="portlet">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#575962]">
              Change Password
            </h3>
            <p className="mt-0.5 text-sm text-[#a7abc3]">
              Update your password. Minimum 8 characters required.
            </p>
          </div>

          {passwordSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#28a745]/20 bg-[#28a745]/5 p-3 text-sm text-[#28a745]">
              <CheckCircleIcon className="size-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#dc3545]/20 bg-[#dc3545]/5 p-3 text-sm text-[#dc3545]">
              <AlertCircleIcon className="size-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className="text-xs font-bold uppercase tracking-wider text-[#a7abc3]"
              >
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="max-w-md border-[#ebeef0] bg-[#f7f8fa] focus:border-brand focus:bg-white"
                required
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-xs font-bold uppercase tracking-wider text-[#a7abc3]"
                >
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-[#ebeef0] bg-[#f7f8fa] focus:border-brand focus:bg-white"
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold uppercase tracking-wider text-[#a7abc3]"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-[#ebeef0] bg-[#f7f8fa] focus:border-brand focus:bg-white"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-[#ebeef0] pt-4">
              <Button
                type="submit"
                disabled={passwordLoading}
                className="gap-2 bg-brand text-white hover:bg-brand-hover"
              >
                {passwordLoading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ShieldIcon className="size-4" />
                )}
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </TabsContent>

      {/* Delete Account Tab */}
      <TabsContent value="delete">
        <div className="portlet border-[#dc3545]/20">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#dc3545]">
              Delete Account
            </h3>
            <p className="mt-0.5 text-sm text-[#a7abc3]">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <div className="rounded-lg border border-[#dc3545]/20 bg-[#dc3545]/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-[#dc3545]" />
              <div>
                <p className="text-sm font-medium text-[#dc3545]">
                  This action is irreversible
                </p>
                <p className="mt-1 text-sm text-[#a7abc3]">
                  Deleting your account will permanently remove all your brands,
                  campaigns, participants, and referral data. This cannot be
                  undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3 gap-2"
                  disabled
                >
                  <Trash2Icon className="size-4" />
                  Delete My Account
                </Button>
                <p className="mt-2 text-xs text-[#a7abc3]">
                  Contact support@referrals.com to delete your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

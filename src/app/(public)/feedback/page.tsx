"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "feature", message: "" });
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, subject: `Feedback: ${form.type}` }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-green-600">Thank you!</h1>
        <p className="mt-4 text-gray-600">Your feedback has been submitted. We review every submission and use it to improve the platform.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
          <CardDescription>Help us improve Referrals.com. Feature requests, bug reports, and suggestions are all welcome.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Feedback Type</Label>
              <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="improvement">Improvement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Your Feedback</Label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder="Tell us what you think..." />
            </div>
            <Button type="submit" className="w-full">Submit Feedback</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

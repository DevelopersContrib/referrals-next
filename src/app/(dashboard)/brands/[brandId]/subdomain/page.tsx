"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function SubdomainPage() {
  const params = useParams();
  const [subdomain, setSubdomain] = useState("");
  const [currentSubdomain, setCurrentSubdomain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/brands/${params.brandId}/subdomain`)
      .then((r) => r.json())
      .then((data) => {
        if (data.subdomain) {
          setCurrentSubdomain(data.subdomain);
          setSubdomain(data.subdomain.subdomain || "");
        }
      });
  }, [params.brandId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/brands/${params.brandId}/subdomain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Subdomain saved successfully!");
        setCurrentSubdomain(data.subdomain);
      } else {
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Subdomain & Whitelabel</h1>

      <Card>
        <CardHeader>
          <CardTitle>Custom Subdomain</CardTitle>
          <CardDescription>
            Set up a custom subdomain for your referral pages (e.g., refer.yourbrand.com)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentSubdomain && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Current:</span>
              <Badge variant="secondary">{currentSubdomain.subdomain}.referrals.com</Badge>
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="yourbrand"
                />
                <span className="text-sm text-muted-foreground">.referrals.com</span>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Subdomain"}
            </Button>
            {message && (
              <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Point your own domain to Referrals.com for a fully whitelabeled experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To use a custom domain, add a CNAME record pointing to <code className="bg-gray-100 px-1 rounded">proxy.referrals.com</code>, then contact support to verify.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/billing/plans?planId=${params.planId}`)
      .then((r) => r.json())
      .then((data) => setPlan(data.plan))
      .catch(console.error);
  }, [params.planId]);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: parseInt(params.planId as string, 10) }),
      });
      const data = await res.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert(data.error || "Failed to create subscription");
      }
    } catch {
      alert("Something went wrong");
    }
    setLoading(false);
  }

  if (!plan) {
    return <div className="p-8 text-center text-muted-foreground">Loading plan details...</div>;
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>
            ${Number(plan.price || 0).toFixed(2)}/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Up to {plan.no_of_domains || "unlimited"} brands</p>
            <p>{plan.campaigns_participants || "unlimited"} participants per campaign</p>
            <p>{plan.days || 30} day billing cycle</p>
          </div>
          <Button onClick={handleSubscribe} disabled={loading} className="w-full" size="lg">
            {loading ? "Redirecting to PayPal..." : `Subscribe — $${Number(plan.price || 0).toFixed(2)}/mo`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll be redirected to PayPal to complete payment. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

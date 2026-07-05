"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingFlow({ userName }: { userName: string }) {
  const router = useRouter();
  const [website, setWebsite] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdBrandId, setCreatedBrandId] = useState<number | null>(null);

  async function handleCreateBrand(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = website.match(/^https?:\/\//)
      ? website
      : `https://${website}`;

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized, description: name || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create your brand. Please try again.");
        setLoading(false);
        return;
      }

      setCreatedBrandId(data.id);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const firstName = userName.split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left: guidance */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF5C62]/30 bg-[#FF5C62]/10 px-3 py-1 text-xs font-medium text-[#FF5C62]">
            Step {createdBrandId ? "2" : "1"} of 2
          </span>
          <h1
            className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-dosis), sans-serif" }}
          >
            {createdBrandId
              ? "Your brand is ready 🎉"
              : `Welcome, ${firstName}! Let's launch your first campaign.`}
          </h1>
          <p className="mt-3 max-w-md text-gray-600">
            {createdBrandId
              ? "Now create your first referral campaign — it's free, fully-featured, and takes just a few minutes."
              : "Add the website you want to grow. We'll set it up as your first brand — your first campaign is always free."}
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-600">
            {[
              "1 free campaign & domain — every feature included",
              "Gamification, voting, analytics & anti-fraud on free",
              "Add more domains anytime for $9/month each",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: action card */}
        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-lg shadow-rose-100/50 sm:p-8">
          {!createdBrandId ? (
            <form onSubmit={handleCreateBrand} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="website">Your website</Label>
                <Input
                  id="website"
                  placeholder="yourbrand.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandName">
                  Brand name{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="brandName"
                  placeholder="Your Brand"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#FF5C62] hover:bg-[#ff4f58]"
                disabled={loading}
              >
                {loading ? "Setting up…" : "Continue"}
              </Button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
              >
                Skip for now
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C62]/15 to-[#926efb]/15">
                <svg
                  className="h-7 w-7 text-[#FF5C62]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <Link href={`/brands/${createdBrandId}/campaigns/new`}>
                <Button className="w-full bg-[#FF5C62] hover:bg-[#ff4f58]">
                  Launch my first campaign
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-rose-200">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

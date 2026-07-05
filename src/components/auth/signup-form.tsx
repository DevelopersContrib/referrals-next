"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";

const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One letter", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/signup/success?email=" + encodeURIComponent(form.email));
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center lg:text-left">
        <h1
          className="text-3xl font-bold tracking-tight text-gray-900"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Start growing with referrals — your first campaign is free.
        </p>
      </div>

      <div className="mt-8">
        <GoogleButton callbackUrl="/dashboard" label="Sign up with Google" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          or sign up with email
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              minLength={8}
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {(passwordFocused || form.password.length > 0) && (
            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const ok = rule.test(form.password);
                return (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-2 text-xs ${
                      ok ? "text-emerald-600" : "text-gray-400"
                    }`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF5C62] hover:bg-[#ff4f58]"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-xs text-gray-500">
          Free to start · No credit card · Launch in 10 minutes
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-[#FF5C62] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

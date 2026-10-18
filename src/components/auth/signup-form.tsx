"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { TurnstileWidget, TURNSTILE_SITE_KEY } from "@/components/auth/turnstile-widget";

const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One letter", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

function readRref() {
  if (typeof document === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("rref") || "";
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("rref="))
    ?.split("=")[1];
  return fromUrl || cookie || "";
}

export function SignupForm({ googleEnabled = true }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const waitingForCheck = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken;

  useEffect(() => {
    const rref = new URLSearchParams(window.location.search).get("rref");
    if (rref && /^\d+$/.test(rref)) {
      document.cookie = `rref=${rref}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rref: readRref(),
          turnstileToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        // The token is single-use: get a fresh one for the next try.
        setTurnstileReset((n) => n + 1);
        return;
      }

      // VNOC Analytics conversion. It used to fire on /signup/success, which
      // the new flow skips, so record it here before moving on.
      try {
        window.vnoc?.track?.("signup", "conversion");
      } catch {
        /* tracking must never block sign-up */
      }

      // Sign the new member straight in and start onboarding. Email
      // verification happens in the background (banner + resend link).
      const signedIn = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signedIn?.error) {
        router.push("/signup/success?email=" + encodeURIComponent(form.email));
        return;
      }
      router.push("/onboarding");
      router.refresh();
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
          Set up your referral program. Pay $9/mo per brand when you publish.
        </p>
      </div>

      {googleEnabled ? (
        <>
          <div className="mt-8">
            <GoogleButton callbackUrl="/onboarding" label="Sign up with Google" />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              or sign up with email
            </span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
        </>
      ) : (
        <div className="mt-8" />
      )}

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
          <PasswordField
            id="password"
            placeholder="Create a password"
            value={form.password}
            onValueChange={(v) => updateForm("password", v)}
            onFocus={() => setPasswordFocused(true)}
            minLength={8}
            required
          />
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <TurnstileWidget action="signup" onToken={setTurnstileToken} resetKey={turnstileReset} />

        <Button
          type="submit"
          className="w-full bg-[#FF5C62] hover:bg-[#ff4f58]"
          disabled={loading || waitingForCheck}
        >
          {loading
            ? "Creating account…"
            : waitingForCheck
              ? "Checking your browser…"
              : "Create account"}
        </Button>

        <p className="text-center text-xs text-gray-500">
          Set up free · $9/mo per brand to go live
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-[#FF5C62] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

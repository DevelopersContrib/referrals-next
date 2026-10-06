"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";

export function SignInForm() {
  return (
    <Suspense>
      <SignInFormInner />
    </Suspense>
  );
}

function SignInFormInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl });
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center lg:text-left">
        <h1
          className="text-3xl font-bold tracking-tight text-gray-900"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to keep your referral programs growing.
        </p>
      </div>

      <div className="mt-8">
        <GoogleButton callbackUrl={callbackUrl} label="Sign in with Google" />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          or sign in with email
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          Invalid email or password. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#FF5C62] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            value={password}
            onValueChange={setPassword}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF5C62] hover:bg-[#ff4f58]"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#FF5C62] hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}

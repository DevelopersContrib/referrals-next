"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleIcon } from "@/components/auth/google-icon";

export function GoogleButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signIn("google", { callbackUrl });
      }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleIcon className="h-5 w-5" />
      {loading ? "Redirecting…" : label}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SendInvitePage() {
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!id) return;

    // Track the invite send and redirect
    fetch(`/api/widget/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareCode: id }),
    })
      .then((res) => {
        if (res.ok) {
          setStatus("success");
          // Redirect to invite destination after short delay
          setTimeout(() => {
            window.location.href = `/invite/${id}`;
          }, 1500);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#212529] flex items-center justify-center px-4">
      <div className="bg-[#292A2D] rounded-2xl p-10 max-w-md w-full text-center border border-[#3a3b3e]">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-[#926efb] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-semibold text-white mb-2">Processing your invite...</h1>
            <p className="text-gray-400">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-semibold text-white mb-2">Invite Sent!</h1>
            <p className="text-gray-400 mb-6">Redirecting you now...</p>
            <Link href={`/invite/${id}`} className="text-[#926efb] underline text-sm">
              Click here if not redirected
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-white mb-2">Invalid Invite Link</h1>
            <p className="text-gray-400 mb-6">This invite link may have expired or is invalid.</p>
            <Link
              href="/"
              className="bg-[#FF5C62] hover:bg-[#e54e54] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Go Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

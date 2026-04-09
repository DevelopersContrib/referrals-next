"use client";

import { useState } from "react";
import type { Metadata } from "next";

const meta = {
  title: "Send to Friends | Referrals.com",
  description:
    "Share Referrals.com with your friends. Send them an invitation to join our referral marketing platform.",
};

export default function SendToFriendsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [message, setMessage] = useState(
    "Hey! I thought you might like Referrals.com — it's a great platform for building referral programs."
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          friendEmail,
          message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setFriendEmail("");
      setMessage(
        "Hey! I thought you might like Referrals.com — it's a great platform for building referral programs."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </head>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Send to Friends
          </h1>
          <p className="mt-3 text-gray-400">
            Invite your friends to discover the power of referral marketing.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#292A2D] p-6 sm:p-8">
          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Invitation Sent!
              </h2>
              <p className="mt-2 text-gray-400">
                Your friend will receive an email shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 rounded-lg bg-[#FF5C62] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#ff4f58]"
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="friendEmail"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Friend&apos;s Email
                </label>
                <input
                  id="friendEmail"
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  required
                  placeholder="friend@example.com"
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-medium text-gray-300"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#FF5C62]/50 focus:ring-1 focus:ring-[#FF5C62]/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#FF5C62] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#FF5C62]/25 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

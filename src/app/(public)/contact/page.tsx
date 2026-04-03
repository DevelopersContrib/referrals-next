"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
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
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#212529]">
      {/* Hero */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Have a question or need help? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-[#292A2D] p-8">
              <h2 className="text-xl font-semibold text-white">
                Send us a message
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Fill out the form below and we&apos;ll get back to you as soon
                as possible.
              </p>

              {success && (
                <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                  Thank you for your message! We&apos;ll be in touch soon.
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#212529] px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#ff646c] focus:outline-none focus:ring-1 focus:ring-[#ff646c]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#212529] px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#ff646c] focus:outline-none focus:ring-1 focus:ring-[#ff646c]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="How can we help?"
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#212529] px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#ff646c] focus:outline-none focus:ring-1 focus:ring-[#ff646c]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#ff646c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#ff4f58] hover:shadow-lg hover:shadow-[#ff646c]/25 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Get in Touch
                  </h3>
                  <p className="mt-2 text-gray-400">
                    We are here to help and answer any questions you might have.
                    We look forward to hearing from you.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-[#ff646c]/10 p-3 text-[#ff646c]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">Phone</p>
                      <p className="mt-1 text-sm text-gray-400">
                        1-888-Referrals
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-[#926efb]/10 p-3 text-[#926efb]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">Email</p>
                      <p className="mt-1 text-sm text-gray-400">
                        support@referrals.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-[#ff646c]/10 p-3 text-[#ff646c]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">Support Hours</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Monday - Friday, 9am - 6pm EST
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#292A2D] p-6">
                  <h3 className="font-semibold text-white">Quick Links</h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href="/support"
                      className="text-sm text-[#ff646c] hover:underline"
                    >
                      Visit Support Center
                    </Link>
                    <Link
                      href="/knowledgebase"
                      className="text-sm text-[#ff646c] hover:underline"
                    >
                      Browse Knowledgebase
                    </Link>
                    <Link
                      href="/forum"
                      className="text-sm text-[#ff646c] hover:underline"
                    >
                      Join Community Forum
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

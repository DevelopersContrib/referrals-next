"use client";

import { useState } from "react";

export default function LanderCustomizePage() {
  const [headline, setHeadline] = useState("Join Our Referral Program");
  const [description, setDescription] = useState(
    "Share with your friends and earn rewards for every successful referral."
  );
  const [buttonText, setButtonText] = useState("Get Started");
  const [bgColor, setBgColor] = useState("#212529");
  const [accentColor, setAccentColor] = useState("#FF5C62");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/lander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description,
          buttonText,
          bgColor,
          accentColor,
          textColor,
          bgImageUrl,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Landing Page Customizer
        </h1>
        <p className="mt-2 text-gray-400">
          Customize how your referral landing page looks.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-[#292A2D] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-3 py-2 text-sm text-white outline-none focus:border-[#FF5C62]/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-3 py-2 text-sm text-white outline-none focus:border-[#FF5C62]/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Button Text
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-3 py-2 text-sm text-white outline-none focus:border-[#FF5C62]/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="text-xs text-gray-400">{bgColor}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Accent
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="text-xs text-gray-400">{accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Text
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="text-xs text-gray-400">{textColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Background Image URL (optional)
                </label>
                <input
                  type="url"
                  value={bgImageUrl}
                  onChange={(e) => setBgImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-white/10 bg-[#212529] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF5C62]/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#FF5C62] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#ff4f58] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Customization"}
                </button>
                {saved && (
                  <span className="text-sm text-green-400">Saved!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/10 p-1">
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-gray-500">Preview</span>
            </div>

            <div
              className="flex min-h-[500px] items-center justify-center rounded-xl p-8"
              style={{
                backgroundColor: bgColor,
                backgroundImage: bgImageUrl
                  ? `url(${bgImageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="w-full max-w-md text-center">
                <h2
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: textColor }}
                >
                  {headline || "Your Headline Here"}
                </h2>
                <p className="mt-3 text-sm" style={{ color: `${textColor}99` }}>
                  {description || "Your description here..."}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    disabled
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm placeholder-white/50"
                    style={{ color: textColor }}
                  />
                  <button
                    disabled
                    className="rounded-lg px-6 py-3 text-sm font-medium text-white transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                    {buttonText || "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

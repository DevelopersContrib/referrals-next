"use client";

import { useEffect, useState } from "react";
import { CheckIcon, Loader2Icon, RocketIcon } from "lucide-react";

/**
 * Full-screen "we're launching your brand" moment shown while the payment is
 * confirmed and the brand + campaign go live. Purely visual: the steps advance
 * on a timer so the wait feels like progress; the real work happens in the
 * confirm request behind it.
 */

const STEPS = [
  "Payment approved",
  "Switching your brand on",
  "Opening your widget to signups",
  "Putting your share link live",
];

const CONFETTI_COLORS = ["#ff5c62", "#7c3aed", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];

export function LaunchOverlay({ brandName }: { brandName?: string | null }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 1100);
    return () => window.clearInterval(id);
  }, []);

  const name = brandName?.trim() || "your brand";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#1a0b2e]/95 via-[#3b0f2b]/95 to-[#1a0b2e]/95 p-4 backdrop-blur-sm"
    >
      <style>{`
        @keyframes rr-float { 0%,100% { transform: translateY(0) rotate(-45deg) } 50% { transform: translateY(-14px) rotate(-45deg) } }
        @keyframes rr-flame { 0%,100% { opacity: .55; transform: scaleY(1) } 50% { opacity: 1; transform: scaleY(1.35) } }
        @keyframes rr-confetti { 0% { transform: translate(0,0) rotate(0); opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) rotate(540deg); opacity: 0 } }
        @keyframes rr-pop { 0% { transform: scale(.6); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .rr-anim { animation: none !important }
        }
      `}</style>

      <div
        className="rr-anim relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-10"
        style={{ animation: "rr-pop .35s ease-out" }}
      >
        {/* Confetti burst */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24">
          {Array.from({ length: 28 }).map((_, i) => {
            const angle = (i / 28) * Math.PI * 2;
            const dist = 120 + (i % 5) * 28;
            return (
              <span
                key={i}
                className="rr-anim absolute block h-2.5 w-1.5 rounded-sm"
                style={
                  {
                    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    "--dx": `${Math.cos(angle) * dist}px`,
                    "--dy": `${Math.sin(angle) * dist}px`,
                    animation: `rr-confetti 1.6s ${(i % 7) * 0.12}s ease-out infinite`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>

        {/* Rocket */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5c62] to-[#7c3aed] shadow-lg shadow-rose-300/50">
          <RocketIcon
            className="rr-anim size-11 text-white"
            style={{ animation: "rr-float 1.4s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <span
            aria-hidden="true"
            className="rr-anim absolute -bottom-3 left-1/2 h-6 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 blur-[1px]"
            style={{ animation: "rr-flame .35s ease-in-out infinite" }}
          />
        </div>

        <h2
          className="mt-8 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          Launching {name}!
        </h2>
        <p className="mt-2 text-base text-gray-600">
          Hang tight, this only takes a few seconds.
        </p>

        <ol className="mx-auto mt-7 max-w-xs space-y-3 text-left">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 text-[15px] transition ${
                  done ? "text-gray-900" : active ? "font-semibold text-gray-900" : "text-gray-400"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-[#ff5c62]/15 text-[#d63a40]"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? (
                    <CheckIcon className="size-4" aria-hidden="true" />
                  ) : active ? (
                    <Loader2Icon className="rr-anim size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        <p className="mt-7 text-xs text-gray-400">Please keep this tab open.</p>
      </div>
    </div>
  );
}

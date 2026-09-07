"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SlugAvailabilityField } from "@/components/brands/slug-availability-field";
import { useSlugAvailability } from "@/hooks/use-slug-availability";
import { slugFromWebsite } from "@/lib/brand-slug";
import { AnalysisPipeline } from "./analysis-pipeline";
import { BrandResults } from "./brand-results";
import type { AnalysisStatus } from "./analysis-types";

const LOGO_URL =
  "https://d1p6j71028fbjm.cloudfront.net/logos/logo-new-referral-1.png";

type Phase = "input" | "analyzing" | "results";

const EXAMPLES = ["stripe.com", "notion.so", "glossier.com"];
const MAX_ANALYSIS_WAIT_MS = 30_000;

function looksLikeUrl(v: string): boolean {
  const t = v.trim();
  if (!t) return false;
  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    return new URL(candidate).hostname.includes(".");
  } catch {
    return false;
  }
}

export function BrandAnalyzer({ firstName }: { firstName?: string }) {
  const [phase, setPhase] = useState<Phase>("input");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  /** Set once the member edits the address; until then it tracks the website. */
  const [customSlug, setCustomSlug] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const analyzeStartedRef = useRef<number | null>(null);

  const valid = looksLikeUrl(url);
  const slug = customSlug ?? slugFromWebsite(url);
  const availability = useSlugAvailability(slug, { enabled: valid });
  const slugBlocked =
    availability.status === "taken" || availability.status === "invalid";

  const showResults = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (pollRef.current) clearTimeout(pollRef.current);
    setTimeout(() => setPhase("results"), 700);
  }, []);

  const poll = useCallback(
    async (id: number) => {
      if (stoppedRef.current) return;
      try {
        const res = await fetch(`/api/brands/analyze/${id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as AnalysisStatus;
          setStatus(data);
          const intel = data.modules?.find((m) => m.module === "intelligence");
          const intelTerminal =
            intel?.status === "done" || intel?.status === "failed";
          const hasPartial =
            Boolean(data.intelligence) ||
            Boolean(data.crawl) ||
            Boolean(data.vnoc?.name || data.vnoc?.logoUrl);
          const elapsed =
            analyzeStartedRef.current != null
              ? Date.now() - analyzeStartedRef.current
              : 0;

          if (
            intelTerminal ||
            data.status === "done" ||
            data.status === "failed" ||
            (elapsed >= MAX_ANALYSIS_WAIT_MS && hasPartial)
          ) {
            showResults();
            return;
          }
        }
      } catch {
        /* transient — keep polling */
      }
      pollRef.current = setTimeout(() => poll(id), 1600);
    },
    [showResults],
  );

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || submitting || slugBlocked) return;
    setSubmitting(true);
    setError(null);
    setNeedsUpgrade(false);

    try {
      const res = await fetch("/api/brands/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "REQUIRES_SUBSCRIPTION") {
          setNeedsUpgrade(true);
        } else if (data.suggestion) {
          // Someone claimed the address between the check and this request.
          setCustomSlug(data.suggestion);
          setError(`${data.error} We switched you to ${data.suggestion}.`);
        } else {
          setError(
            data.error || "Could not start the analysis. Please try again.",
          );
        }
        setSubmitting(false);
        return;
      }

      stoppedRef.current = false;
      analyzeStartedRef.current = Date.now();
      setJobId(data.jobId);
      setPhase("analyzing");
      poll(data.jobId);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (phase === "analyzing" && jobId) {
    return <AnalysisPipeline status={status} url={url} />;
  }

  if (phase === "results" && status) {
    return <BrandResults status={status} />;
  }

  // ── Input phase ──
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-4 py-12">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link href="/" className="mb-5 flex w-fit items-center">
          <Image
            src={LOGO_URL}
            alt="Referrals.com"
            width={104}
            height={33}
            priority
            unoptimized
          />
        </Link>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FF5C62]/25 bg-gradient-to-r from-[#FF5C62]/10 to-[#926efb]/10 px-3.5 py-1.5 text-xs font-semibold text-[#FF5C62]">
          <Sparkles className="h-3.5 w-3.5" />
          AI Brand Intelligence
        </div>

        <h1
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[2.6rem] sm:leading-[1.1]"
          style={{ fontFamily: "var(--font-dosis), sans-serif" }}
        >
          {firstName
            ? `${firstName}, let's analyze your brand.`
            : "Let's analyze your brand."}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600">
          Drop in your website and our AI reads your brand, finds your social
          presence, and scores your referral readiness — usually in about 15
          seconds.
        </p>

        <form onSubmit={handleAnalyze} className="mt-8">
          <div
            className={`group flex items-center gap-2 rounded-2xl border-2 bg-white p-2 pl-4 shadow-sm transition-all focus-within:shadow-lg ${
              touched && !valid
                ? "border-red-300"
                : "border-gray-200 focus-within:border-[#FF5C62]"
            }`}
          >
            <Globe className="h-5 w-5 flex-shrink-0 text-gray-400 group-focus-within:text-[#FF5C62]" />
            <input
              type="text"
              inputMode="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="yourbrand.com"
              aria-label="Website URL"
              className="min-w-0 flex-1 bg-transparent py-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
            <Button
              type="submit"
              disabled={submitting || slugBlocked}
              title={
                slugBlocked
                  ? "Pick an available public address first"
                  : undefined
              }
              className="h-11 shrink-0 gap-1.5 rounded-xl bg-[#FF5C62] px-5 text-sm font-semibold hover:bg-[#ff4f58]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />{" "}
                  Starting…
                </>
              ) : (
                <>
                  Analyze My Brand <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {touched && !valid && (
            <p className="mt-2 pl-1 text-sm text-red-500">
              Enter a valid website, like{" "}
              <span className="font-medium">yourbrand.com</span>.
            </p>
          )}
          {error && <p className="mt-2 pl-1 text-sm text-red-500">{error}</p>}

          {valid && (
            <div className="mt-4 rounded-2xl border border-[#ebeef0] bg-white/70 p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300 sm:p-5">
              <SlugAvailabilityField
                value={slug}
                onChange={(next) => setCustomSlug(next || null)}
                availability={availability}
                hint="We reserve this address the moment you hit Analyze."
                disabled={submitting}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setUrl(ex);
                  setTouched(false);
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:border-[#FF5C62]/40 hover:text-[#FF5C62]"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        {needsUpgrade && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-in fade-in">
            <p className="font-semibold text-amber-900">Add another domain</p>
            <p className="mt-1 text-sm text-amber-800">
              Your Growth trial includes full features. Adding more domains
              after trial (or beyond free caps) is $9/month each — upgrade to
              continue.
            </p>
            <Link href="/billing" className="mt-3 inline-block">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Upgrade to add this domain
              </Button>
            </Link>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          No credit card. No forms. Just your website — we do the rest.
        </p>
      </div>
    </div>
  );
}

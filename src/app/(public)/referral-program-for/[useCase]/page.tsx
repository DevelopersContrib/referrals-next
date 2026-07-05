import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUseCase, useCases } from "@/lib/use-cases";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageJsonLd } from "@/lib/structured-data";

interface Props {
  params: Promise<{ useCase: string }>;
}

export function generateStaticParams() {
  return useCases.map((u) => ({ useCase: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { useCase } = await params;
  const data = getUseCase(useCase);
  if (!data) return { title: "Referral Program" };

  const url = `https://referrals.com/referral-program-for/${data.slug}`;
  return {
    title: `${data.headline} | Referrals.com`,
    description: data.subhead,
    alternates: { canonical: url },
    openGraph: {
      title: `${data.headline} | Referrals.com`,
      description: data.subhead,
      url,
      siteName: "Referrals.com",
      type: "website",
      images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    },
    twitter: {
      card: "summary",
      title: data.headline,
      description: data.subhead,
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { useCase } = await params;
  const data = getUseCase(useCase);
  if (!data) notFound();

  return (
    <div className="bg-gradient-to-b from-white via-rose-50/40 to-orange-50/30">
      <JsonLd data={faqPageJsonLd(data.faqs)} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#FF5C62] shadow-sm">
            Referral marketing for {data.label}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {data.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{data.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:bg-[#ff4f58]"
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-4 pb-4">
        <p className="text-center text-lg leading-relaxed text-gray-700">{data.intro}</p>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {data.benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-rose-100/60 bg-white/70 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 space-y-4">
            {data.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-4">
                <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5C62] to-[#926efb] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-1 text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Frequently asked
        </h2>
        <dl className="mt-8 space-y-4">
          {data.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <dt className="font-semibold text-gray-900">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related use cases (internal linking) */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          Referral programs for every team
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases
            .filter((u) => u.slug !== data.slug)
            .map((u) => (
              <Link
                key={u.slug}
                href={`/referral-program-for/${u.slug}`}
                className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-rose-200 hover:text-[#FF5C62]"
              >
                {u.label}
              </Link>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#ff646c] via-[#ff5c62] to-[#926efb] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Launch your first campaign free</h2>
          <p className="mt-3 text-white/90">
            Every feature included. No credit card. Add domains for $9/mo as you grow.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#ff646c] shadow-lg transition hover:bg-gray-50"
          >
            Start free
          </Link>
        </div>
      </section>
    </div>
  );
}

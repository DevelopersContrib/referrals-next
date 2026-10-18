import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, CheckIcon, GiftIcon, UserPlusIcon, ZapIcon } from "lucide-react";
import { getUseCase, useCases } from "@/lib/use-cases";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageJsonLd } from "@/lib/structured-data";

interface Props {
  params: Promise<{ useCase: string }>;
}

/** Display names for /campaign-templates slugs used by the audience pages. */
const TEMPLATE_NAMES: Record<string, string> = {
  "social-instant": "Social Instant Reward",
  "token-reward": "Token Reward",
  "download-giveaway": "Download Giveaway",
  "photo-voting": "Photo Voting",
  "poll-campaign": "Poll Campaign",
  "closed-beta": "Closed Beta Waitlist",
  "info-bar": "Info Bar",
  "full-page": "Full Page Takeover",
};

export function generateStaticParams() {
  return useCases.map((u) => ({ useCase: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { useCase } = await params;
  const data = getUseCase(useCase);
  if (!data) return { title: "Referral Program" };

  const url = `https://www.referrals.com/referral-program-for/${data.slug}`;
  return {
    title: { absolute: data.metaTitle },
    description: data.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url,
      siteName: "Referrals.com",
      type: "website",
      images: [{ url: "/images/logo/logo.png", width: 284, height: 90 }],
    },
    twitter: {
      card: "summary",
      title: data.metaTitle,
      description: data.metaDescription,
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { useCase } = await params;
  const data = getUseCase(useCase);
  if (!data) notFound();

  const signupHref = `/signup?ref=usecase&uc=${data.slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Referrals.com", item: "https://www.referrals.com/" },
      { "@type": "ListItem", position: 2, name: "Referral programs", item: "https://www.referrals.com/resources" },
      {
        "@type": "ListItem",
        position: 3,
        name: data.label,
        item: `https://www.referrals.com/referral-program-for/${data.slug}`,
      },
    ],
  };

  return (
    <div className="bg-gradient-to-b from-white via-rose-50/40 to-orange-50/30">
      <JsonLd data={faqPageJsonLd(data.faqs)} />
      <JsonLd data={breadcrumb} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(255,92,98,0.16),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <span className="inline-flex rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-[#e0464c] shadow-sm">
            Referral programs for {data.label.toLowerCase()}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {data.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {data.subhead}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={signupHref}
              className="rounded-xl bg-[#FF5C62] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:bg-[#ff4f58]"
            >
              Set up your program free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 shadow-sm transition hover:border-rose-200"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            No card to set up · $9/mo when you go live · Cancel anytime
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-4 pb-4">
        <p className="text-center text-lg leading-relaxed text-gray-700">
          {data.intro}
        </p>
      </section>

      {/* Ready-to-use offer */}
      <section className="mx-auto max-w-4xl px-4 pt-12">
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            A reward you can launch today
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-rose-50/70 p-5">
              <UserPlusIcon className="size-6 text-[#e0464c]" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                The friend
              </p>
              <p className="mt-1 font-semibold text-gray-900">{data.offer.give}</p>
            </div>
            <div className="rounded-2xl bg-violet-50/70 p-5">
              <GiftIcon className="size-6 text-[#7c3aed]" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                The referrer
              </p>
              <p className="mt-1 font-semibold text-gray-900">{data.offer.get}</p>
            </div>
            <div className="rounded-2xl bg-amber-50/70 p-5">
              <ZapIcon className="size-6 text-amber-600" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                When it pays out
              </p>
              <p className="mt-1 font-semibold text-gray-900">{data.offer.trigger}</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-600">{data.math}</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Why it works for {data.label.toLowerCase()}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {b.body}
              </p>
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

      {/* Templates */}
      <section className="mx-auto max-w-5xl px-4 pt-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Templates that fit
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {data.templates.map((slug) => (
            <Link
              key={slug}
              href={`/campaign-templates/${slug}`}
              className="group flex items-center justify-between rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <span className="font-semibold text-gray-900">
                {TEMPLATE_NAMES[slug] ?? slug}
              </span>
              <ArrowRightIcon
                className="size-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-[#e0464c]"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Questions, answered
        </h2>
        <dl className="mt-8 space-y-4">
          {data.faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
            >
              <dt className="font-semibold text-gray-900">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-gray-600">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related use cases (internal linking) */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          Referral programs for other businesses
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases
            .filter((u) => u.slug !== data.slug)
            .map((u) => (
              <Link
                key={u.slug}
                href={`/referral-program-for/${u.slug}`}
                className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-rose-200 hover:text-[#e0464c]"
              >
                {u.label}
              </Link>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#e0464c] via-[#d63a40] to-[#7c3aed] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Start your {data.label.toLowerCase()} referral program
          </h2>
          <ul className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-white/95">
            {["Set up free", "$9/mo when you go live", "Cancel anytime"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="size-4" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href={signupHref}
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-lg font-semibold text-[#d63a40] shadow-lg transition hover:bg-gray-50"
          >
            Set up your program free
          </Link>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { NetworkCta } from "@/components/network/network-chrome";
import { NetworkPageIntro } from "@/components/network/network-page-intro";
import { networkDesign, requireNetworkSite } from "../site";

type Props = { params: Promise<{ site: string }> };

export const metadata: Metadata = {
  title: "How it works",
  alternates: { canonical: "/how-it-works" },
};

export default async function NetworkHowItWorksPage({ params }: Props) {
  const site = await requireNetworkSite(params);
  const design = await networkDesign(site);

  return (
    <>
      <NetworkPageIntro design={design} title={`How ${site.name} works`} sub={site.description} />

      <div className="mx-auto grid max-w-5xl gap-16 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
        <ol className="relative ml-5 border-l-2 border-[var(--net-primary)]/25">
          {site.steps.map((s, i) => (
            <li key={s.title} className="relative pb-12 pl-10 last:pb-0">
              <span className="absolute -left-[1.3rem] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--net-primary)] font-bold text-white ring-4 ring-white">
                {i + 1}
              </span>
              <h2 className="pt-1.5 text-xl font-bold">{s.title}</h2>
              <p className="mt-2 max-w-prose leading-relaxed text-[var(--net-ink)]/70">{s.body}</p>
            </li>
          ))}
        </ol>

        <aside className="self-start rounded-[var(--net-radius)] bg-[var(--net-tint)] p-7">
          <h2 className="text-lg font-bold">Your account lives on Referrals.com</h2>
          <p className="mt-3 leading-relaxed text-[var(--net-ink)]/75">
            {site.name} is part of the Referrals.com network. You sign in there to manage your
            brands, campaigns and billing, with one account for everything.
          </p>
          <NetworkCta site={site} className="mt-6 w-full" />
        </aside>
      </div>
    </>
  );
}

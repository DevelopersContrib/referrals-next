import type { Metadata } from "next";
import { HomePoster } from "@/components/network/home-poster";
import { HomeProfessional } from "@/components/network/home-professional";
import { HomeStorefront } from "@/components/network/home-storefront";
import { HomeStudio } from "@/components/network/home-studio";
import { JsonLd } from "@/components/seo/json-ld";
import { faqPageJsonLd } from "@/lib/structured-data";
import { networkDesign, requireNetworkSite } from "./site";

type Props = { params: Promise<{ site: string }> };

export const metadata: Metadata = { alternates: { canonical: "/" } };

const HOMES = {
  studio: HomeStudio,
  storefront: HomeStorefront,
  poster: HomePoster,
  professional: HomeProfessional,
};

export default async function NetworkHomePage({ params }: Props) {
  const site = await requireNetworkSite(params);
  const Home = HOMES[await networkDesign(site)];
  return (
    <>
      <JsonLd data={faqPageJsonLd(site.faqs)} />
      <Home site={site} />
    </>
  );
}

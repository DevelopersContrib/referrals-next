import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  isNetworkDesign,
  NETWORK_DESIGN_HEADER,
  NETWORK_SITE_HEADER,
  networkSiteByKey,
  type NetworkDesign,
  type NetworkSite,
} from "@/lib/network-sites";

/**
 * The clone for this request. Only pages the proxy rewrote from the clone's
 * own host carry the header, so /network/* never renders on referrals.com.
 */
export async function requireNetworkSite(params: Promise<{ site: string }>): Promise<NetworkSite> {
  const { site: key } = await params;
  const site = networkSiteByKey(key);
  if (!site || (await headers()).get(NETWORK_SITE_HEADER) !== key) notFound();
  return site;
}

/** The clone's configured design, or the one being previewed locally. */
export async function networkDesign(site: NetworkSite): Promise<NetworkDesign> {
  const asked = (await headers()).get(NETWORK_DESIGN_HEADER);
  return isNetworkDesign(asked) ? asked : site.design;
}

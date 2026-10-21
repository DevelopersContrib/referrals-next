import { networkSiteByDomain } from "@/lib/network-sites";

/**
 * Shown on /signin and /signup when someone arrives from a referral network
 * clone (?via=referrals.net), so the jump to Referrals.com doesn't feel like a
 * different company. Only domains in the clone config are honored.
 */
export function NetworkViaNote({ via }: { via: string | string[] | undefined }) {
  const site = networkSiteByDomain(typeof via === "string" ? via : null);
  if (!site) return null;
  return (
    <p className="mb-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
      Continuing from <span className="font-semibold">{site.name}</span>. Your account lives on
      Referrals.com, the platform behind {site.name}.
    </p>
  );
}

import Link from "next/link";
import {
  DEFAULT_PAID_PLAN_ID,
  FREE_PARTICIPANT_CAP,
} from "@/lib/billing-constants";

type DashboardUpgradeCardProps = {
  planName?: string | null;
  price?: number | null;
  unit?: string | null;
  days?: number | null;
  noOfDomains?: number | null;
  campaignsParticipants?: number | null;
};

function buildIncludes(props: DashboardUpgradeCardProps): string[] {
  const domains = props.noOfDomains;
  const participants = props.campaignsParticipants;
  return [
    "Remove Referrals.com branding from your widget",
    domains && domains > 0
      ? `Up to ${domains} brand${domains === 1 ? "" : "s"}`
      : "Add more brands as you grow",
    participants && participants > 0
      ? `${participants.toLocaleString()} participants per campaign`
      : `Grow past the free ${FREE_PARTICIPANT_CAP}-participant cap`,
    "Public campaign pages and leaderboards",
    "Advanced analytics and performance charts",
  ];
}

export function DashboardUpgradeCard({
  planName = "Growth",
  price = 9,
  unit = "month",
  days = 30,
  noOfDomains = 1,
  campaignsParticipants = null,
}: DashboardUpgradeCardProps) {
  const includes = buildIncludes({
    noOfDomains,
    campaignsParticipants,
  });
  const href = `/billing/plan/${DEFAULT_PAID_PLAN_ID}`;
  const displayPrice = Number(price ?? 0);

  return (
    <div className="relative flex w-full min-w-0 flex-col rounded-2xl border border-violet-200/80 bg-white p-5 shadow-xl shadow-violet-200/40 ring-2 ring-[#926efb]/25 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#926efb] via-[#b794f9] to-[#FF5C62]" />
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-1 text-xs font-bold text-white shadow-md">
        Growth plan
      </span>

      <div className="mb-5 rounded-xl bg-gradient-to-br from-violet-500/10 to-rose-50/20 p-4">
        <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
          {planName || "Growth"}
        </h3>
        <div className="mt-3 flex flex-wrap items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            ${displayPrice.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">
            /{unit || "month"} · per brand
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {days || 30}-day billing cycle. Cancel anytime — unlock branding
          removal, multi-domain, and advanced analytics.
        </p>
      </div>

      <ul className="flex-1 space-y-3">
        {includes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm text-gray-700"
          >
            <CheckIcon color="#926efb" />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="mt-6 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#926efb] to-[#7c3aed] px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-violet-300/40 transition-all hover:brightness-105 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#926efb]"
      >
        Upgrade to Growth
      </Link>
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0"
      style={{ color }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

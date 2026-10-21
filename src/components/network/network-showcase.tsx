import type { NetworkShowcase as Showcase } from "@/lib/network-sites";
import styles from "./showcase.module.css";

/**
 * The hero's product moment, drawn in HTML so it stays sharp and themed:
 * an agency's client list or the referral widget a shop's customer sees.
 */
export function NetworkShowcase({
  showcase,
  framed = false,
}: {
  showcase: Showcase;
  /** Wrap in a browser window (storefront design). */
  framed?: boolean;
}) {
  const body =
    showcase.kind === "roster" ? (
      <Roster showcase={showcase} />
    ) : (
      <Widget showcase={showcase} />
    );
  if (!framed) return body;
  return (
    <div className="overflow-hidden rounded-[var(--net-radius)] border border-black/10 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 border-b border-black/10 bg-gray-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-xs text-gray-500">
          {showcase.kind === "widget"
            ? showcase.link.split("/")[0]
            : "referrals.com/brands"}
        </span>
      </div>
      <div
        className={`grid items-center gap-8 bg-white p-5 text-left sm:p-8 ${showcase.kind === "widget" ? "md:grid-cols-[1fr_1.1fr]" : ""}`}
      >
        {/* A sketch of the shop's own site, so the widget reads as living on it. */}
        {showcase.kind === "widget" && (
          <div aria-hidden className="hidden md:block">
            <p className="text-2xl font-bold">{showcase.business}</p>
            <div className="mt-4 space-y-2.5">
              <div className="h-2.5 w-11/12 rounded-full bg-black/[0.07]" />
              <div className="h-2.5 w-4/5 rounded-full bg-black/[0.07]" />
              <div className="h-2.5 w-2/3 rounded-full bg-black/[0.07]" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-[calc(var(--net-radius)*0.5)] bg-[var(--net-tint)]" />
              <div className="aspect-square rounded-[calc(var(--net-radius)*0.5)] bg-[var(--net-accent)]/25" />
              <div className="aspect-square rounded-[calc(var(--net-radius)*0.5)] bg-[var(--net-tint)]" />
            </div>
          </div>
        )}
        {body}
      </div>
    </div>
  );
}

function Roster({
  showcase,
}: {
  showcase: Extract<Showcase, { kind: "roster" }>;
}) {
  const total = showcase.rows.reduce((n, r) => n + r.signups, 0);
  return (
    <div className="rounded-[var(--net-radius)] bg-white text-[var(--net-ink)] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
      <div className="flex items-baseline justify-between border-b border-black/5 px-5 py-4">
        <p className="font-semibold">Your clients</p>
        <p className="text-sm text-gray-500">{total} signups this month</p>
      </div>
      <ul>
        {showcase.rows.map((row, i) => (
          <li
            key={row.client}
            className="flex items-center gap-3 border-b border-black/5 px-5 py-3.5 last:border-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--net-tint)] text-sm font-bold text-[var(--net-primary)]">
              {row.client.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {row.client}
              </span>
              <span className="block truncate text-xs text-gray-500">
                {row.campaign}
              </span>
            </span>
            <span className="relative text-right">
              <span className="block text-sm font-semibold tabular-nums">
                {row.signups}
              </span>
              <span
                className={`block text-xs ${row.live ? "text-emerald-600" : "text-gray-400"}`}
              >
                {row.live ? "Live" : "Draft"}
              </span>
              {i === 0 && (
                <span
                  className={`${styles.arrive} absolute -left-11 top-0 rounded-full bg-[var(--net-primary)] px-2 py-0.5 text-xs font-semibold text-white`}
                >
                  +1
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Widget({
  showcase,
}: {
  showcase: Extract<Showcase, { kind: "widget" }>;
}) {
  return (
    <div className="mx-auto w-full max-w-sm text-left">
      <div className="rounded-[var(--net-radius)] bg-white p-6 text-[var(--net-ink)] shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
        <p className="text-sm text-gray-500">{showcase.business}</p>
        <p className="mt-1 text-2xl font-bold leading-tight">
          {showcase.offer}
        </p>
        <p className="mt-2 text-sm text-gray-600">{showcase.body}</p>
        <div className="mt-5 flex items-center gap-2 rounded-[calc(var(--net-radius)*0.6)] border border-black/10 bg-gray-50 p-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
            {showcase.link}
          </span>
          <span className="rounded-[calc(var(--net-radius)*0.5)] bg-[var(--net-primary)] px-3 py-1.5 text-xs font-semibold text-white">
            Copy link
          </span>
        </div>
        <div className="mt-3 flex gap-2 text-xs font-medium text-gray-600">
          {["Email", "Text", "WhatsApp"].map((c) => (
            <span
              key={c}
              className="rounded-full border border-black/10 px-3 py-1"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <p
        role="status"
        className={`${styles.arrive} mt-3 flex items-center gap-2 rounded-[var(--net-radius)] bg-[var(--net-ink)] px-4 py-3 text-sm text-white shadow-lg`}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        {showcase.toast}
      </p>
    </div>
  );
}

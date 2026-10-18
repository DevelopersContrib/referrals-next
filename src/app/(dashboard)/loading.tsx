/**
 * Shown instantly while any dashboard page loads, so a click always gives
 * feedback (the server work behind these pages can take a few seconds).
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-24 animate-pulse rounded-2xl bg-gradient-to-r from-rose-100/70 to-violet-100/70 motion-reduce:animate-none" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-gray-100 bg-white motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white motion-reduce:animate-none lg:col-span-7" />
        <div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-white motion-reduce:animate-none lg:col-span-5" />
      </div>
    </div>
  );
}

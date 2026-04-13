/** Decorative “plan picker” UI for the pricing hero — static, no client JS */
export function PricingHeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -left-6 -top-8 hidden h-28 w-28 rounded-full bg-[#926efb]/20 blur-2xl lg:block" />
      <div className="absolute -bottom-6 -right-4 hidden h-24 w-40 rounded-full bg-[#FF5C62]/15 blur-2xl lg:block" />
      <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-xl shadow-rose-200/40 ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/90 px-3 py-2">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-red-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-1 truncate text-[10px] text-gray-500">
            referrals.com/pricing
          </span>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Billing
            </p>
            <p className="text-sm font-bold text-gray-900">Choose your growth plan</p>
          </div>
          <div className="grid gap-2">
            {[
              { name: "Pioneer", price: "$299", sub: "/mo · unlimited scale", active: false },
              { name: "Premium", price: "$9", sub: "/brand · most popular", active: true },
              { name: "Enterprise", price: "Custom", sub: "SLA & dedicated support", active: false },
            ].map((row) => (
              <div
                key={row.name}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors ${
                  row.active
                    ? "border-violet-200 bg-gradient-to-r from-violet-50 to-rose-50/50 shadow-sm ring-1 ring-violet-200/60"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-900">{row.name}</p>
                  <p className="text-[10px] text-gray-500">{row.sub}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      row.active ? "text-[#926efb]" : "text-gray-800"
                    }`}
                  >
                    {row.price}
                  </p>
                  {row.active ? (
                    <span className="mt-0.5 inline-block rounded-full bg-[#926efb] px-2 py-0.5 text-[9px] font-semibold text-white">
                      Best value
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-dashed border-rose-200/80 bg-rose-50/40 px-3 py-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Referral volume (30d)</p>
                <p className="text-lg font-bold tabular-nums text-gray-900">12.4k</p>
              </div>
              <div className="flex h-10 items-end gap-0.5">
                {[40, 65, 45, 80, 55, 90, 70, 95, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-t bg-gradient-to-t from-[#FF5C62] to-[#926efb] opacity-90"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { POSTER_DISPLAY, PRO_SERIF } from "@/components/network/network-design";
import type { NetworkDesign } from "@/lib/network-sites";

const BAND: Record<NetworkDesign, { band: string; title: string; sub: string }> = {
  studio: {
    band: "bg-[var(--net-ink)] text-white",
    title: "text-[clamp(2.2rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em]",
    sub: "text-white/70",
  },
  storefront: {
    band: "bg-[var(--net-tint)] text-center",
    title:
      "mx-auto max-w-[18ch] text-[clamp(2.4rem,5.5vw,4rem)] font-extrabold leading-[1] tracking-[-0.035em]",
    sub: "mx-auto text-[var(--net-ink)]/75",
  },
  poster: {
    band: "bg-[var(--net-primary)] text-white",
    title: `text-[clamp(3rem,8vw,6rem)] ${POSTER_DISPLAY}`,
    sub: "text-white/80",
  },
  professional: {
    band: "border-b border-black/10 bg-slate-50",
    title: `max-w-[22ch] text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[1.08] ${PRO_SERIF}`,
    sub: "text-slate-600",
  },
};

/** Top band of an inner page, in the clone's design. */
export function NetworkPageIntro({
  design,
  title,
  sub,
}: {
  design: NetworkDesign;
  title: string;
  sub: string;
}) {
  const style = BAND[design];
  return (
    <section className={style.band}>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className={style.title}>{title}</h1>
        <p className={`mt-5 max-w-[38rem] text-lg leading-relaxed ${style.sub}`}>{sub}</p>
      </div>
    </section>
  );
}

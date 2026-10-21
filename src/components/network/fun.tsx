import type { CSSProperties } from "react";
import type { NetworkSite } from "@/lib/network-sites";
import styles from "./fun.module.css";

/** Bright colors for faces and confetti, alongside the clone's own. */
const PARTY = ["#facc15", "#34d399", "#f472b6", "#38bdf8", "#fb923c", "#a78bfa"];

type Vars = CSSProperties & Record<`--${string}`, string>;

/** A burst of confetti over its parent (which must be position: relative). */
export function Confetti({ site, count = 28 }: { site: NetworkSite; count?: number }) {
  const colors = [site.colors.primary, site.colors.accent, ...PARTY];
  return (
    <div aria-hidden className={styles.confetti}>
      {Array.from({ length: count }, (_, i) => {
        // Deterministic spread so server and client render the same pieces.
        const left = (i * 37) % 100;
        const style: Vars = {
          left: `${left}%`,
          background: colors[i % colors.length],
          animationDelay: `${(i % 7) * 90}ms`,
          "--drop": `${260 + ((i * 53) % 220)}px`,
          "--spin": `${((i * 97) % 720) - 360}deg`,
        };
        return <span key={i} className={styles.piece} style={style} />;
      })}
    </div>
  );
}

/** Tilted badges; each straightens up when pointed at. */
export function Stickers({
  items,
  tone = "light",
  className = "",
}: {
  items: string[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const fills =
    tone === "dark"
      ? ["bg-[#facc15] text-[#1f1300]", "bg-white text-[var(--net-ink)]", "bg-[#f472b6] text-[#2a0016]"]
      : ["bg-[#facc15] text-[#1f1300]", "bg-[var(--net-accent)] text-white", "bg-[var(--net-ink)] text-white"];
  const tilts = ["-4deg", "3deg", "-2deg"];
  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {items.map((label, i) => (
        <li
          key={label}
          className={`${styles.sticker} rounded-full px-4 py-2 text-sm font-bold shadow-[0_6px_0_-1px_rgba(0,0,0,0.18)] ${fills[i % fills.length]}`}
          style={{ "--tilt": tilts[i % tilts.length] } as Vars}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

/** A scrolling feed of program moments. */
export function Ticker({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) =>
    items.map((t, i) => (
      <span key={`${hidden}-${i}`} aria-hidden={hidden || undefined} className="flex items-center gap-8 pr-8">
        <span className="whitespace-nowrap">{t}</span>
        <span aria-hidden className="opacity-50">
          ✦
        </span>
      </span>
    ));
  return (
    <div className={`${styles.tickerWrap} overflow-hidden py-4 text-base font-semibold ${className}`}>
      <div className={styles.tickerTrack}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** A cartoon face: a colored circle with eyes, cheeks and a smile. */
export function Face({ color, variant, size = 88 }: { color: string; variant: number; size?: number }) {
  const ink = "#1b1530";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <circle cx="32" cy="34" r="27" fill={color} />
      {variant % 4 === 0 && <path d="M6 32 C6 4 58 4 58 32 C52 18 40 16 32 21 C24 16 12 18 6 32Z" fill={ink} />}
      {variant % 4 === 1 && (
        <>
          <circle cx="32" cy="7" r="7" fill={ink} />
          <path d="M9 28 C14 10 50 10 55 28 C44 22 20 22 9 28Z" fill={ink} />
        </>
      )}
      {variant % 4 === 2 &&
        [12, 20, 28, 36, 44, 52].map((x) => <circle key={x} cx={x} cy={x % 16 ? 14 : 11} r="7" fill={ink} />)}
      {variant % 4 === 3 && (
        <>
          <path d="M9 25 C9 4 55 4 55 25 Z" fill={ink} />
          <rect x="44" y="21" width="18" height="6" rx="3" fill={ink} />
        </>
      )}
      <circle cx="23" cy="33" r="3.2" fill={ink} />
      <circle cx="41" cy="33" r="3.2" fill={ink} />
      <circle cx="17" cy="41" r="4" fill="#ff6b8b" opacity="0.45" />
      <circle cx="47" cy="41" r="4" fill="#ff6b8b" opacity="0.45" />
      <path d="M23 42 Q32 51 41 42" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * One share becoming new customers: faces in a row, a link travelling
 * between them and the reward popping up at each hop.
 */
export function ReferralChain({
  site,
  tone = "light",
  plain = false,
}: {
  site: NetworkSite;
  tone?: "light" | "dark";
  /** Professional look: initials instead of cartoon faces, a calm reward tag. */
  plain?: boolean;
}) {
  const { people, reward } = site.chain;
  const sub = tone === "dark" ? "text-white/70" : "text-[var(--net-ink)]/65";
  const rewardTag = plain
    ? "rounded-md bg-[var(--net-tint)] px-2 py-1 text-xs font-semibold text-[var(--net-primary)] ring-1 ring-[var(--net-primary)]/20"
    : "rounded-xl bg-[#facc15] px-2 py-1 text-xs font-extrabold text-[#1f1300] shadow-[0_4px_0_rgba(0,0,0,0.2)]";
  const rewardText = plain ? reward : `${reward}!`;
  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-[repeat(var(--n),minmax(0,1fr))] md:gap-0" style={{ "--n": String(people.length) } as Vars}>
      {people.map((p, i) => (
        <li key={p.name} className="relative flex flex-col items-center text-center">
          {i < people.length - 1 && (
            <div
              aria-hidden
              className="absolute left-[calc(50%+3rem)] right-[calc(-50%+3rem)] top-11 hidden md:block"
            >
              <div className="border-t-[3px] border-dashed border-current opacity-30" />
              <span
                className={`${styles.token} rounded-full bg-[var(--net-primary)] text-xs font-bold text-white ${plain ? "h-3 w-3" : "px-2 py-0.5"}`}
                style={{ "--delay": `${i * 1.5}s` } as Vars}
              >
                {plain ? null : "🔗"}
              </span>
              <span
                className={`${styles.reward} absolute -top-12 left-1/2 -ml-11 inline-block w-22 text-center ${rewardTag} ${plain ? "!animate-none !transform-none" : ""}`}
                style={{ "--delay": `${i * 1.5}s` } as Vars}
              >
                {rewardText}
              </span>
            </div>
          )}
          {plain ? (
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--net-tint)] text-2xl font-semibold text-[var(--net-primary)] ring-1 ring-[var(--net-primary)]/15">
              {p.name.charAt(0)}
            </span>
          ) : (
            <span className={styles.bob} style={{ "--delay": `${i * 0.4}s` } as Vars}>
              <Face color={PARTY[i % PARTY.length]} variant={i} />
            </span>
          )}
          <span className="mt-3 text-lg font-bold">{p.name}</span>
          <span className={`mt-1 max-w-[12rem] text-sm ${sub}`}>{p.does}</span>
          {/* Phones have no connectors, so the reward sits under the person instead. */}
          {i > 0 && (
            <span className={`mt-2 md:hidden ${plain ? rewardTag : "rotate-[-4deg] rounded-lg bg-[#facc15] px-2 py-0.5 text-xs font-extrabold text-[#1f1300]"}`}>
              {rewardText}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Class for a button that bounces on hover. */
export const BOUNCY = styles.bouncy;

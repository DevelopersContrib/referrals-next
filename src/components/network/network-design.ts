import {
  Bricolage_Grotesque,
  IBM_Plex_Sans,
  Instrument_Sans,
  Schibsted_Grotesk,
  Source_Serif_4,
} from "next/font/google";
import type { NetworkDesign } from "@/lib/network-sites";

// One family per design. Not preloaded: a clone page only uses one of them.
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz", "wdth"], preload: false });
const instrument = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], preload: false });
// Professional pairs a sans body with serif headlines (see PRO_SERIF).
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], preload: false });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-net-serif",
  preload: false,
});

export type DesignTokens = {
  font: string;
  /** Corner radius for panels and buttons. */
  radius: string;
  header: "dark" | "tint" | "light" | "clean";
};

export const DESIGN_TOKENS: Record<NetworkDesign, DesignTokens> = {
  studio: { font: schibsted.className, radius: "14px", header: "dark" },
  storefront: { font: bricolage.className, radius: "22px", header: "tint" },
  poster: { font: instrument.className, radius: "4px", header: "light" },
  professional: { font: `${plex.className} ${sourceSerif.variable}`, radius: "8px", header: "clean" },
};

export const DESIGN_LABEL: Record<NetworkDesign, string> = {
  studio: "Studio",
  storefront: "Storefront",
  poster: "Poster",
  professional: "Professional",
};

/** Condensed display type: the poster design's one loud element. */
export const POSTER_DISPLAY = "font-bold uppercase leading-[0.9] tracking-[-0.01em] [font-stretch:75%]";

/** Serif headline face for the professional design. */
export const PRO_SERIF = "[font-family:var(--font-net-serif)] font-semibold tracking-[-0.015em]";

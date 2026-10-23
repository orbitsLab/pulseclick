import { Geist_Mono, Instrument_Serif, Onest } from "next/font/google";

/**
 * PulseTick type system — three voices, one job each.
 *
 * - `onest` is the product voice: every label, control, task title and
 *   paragraph. It is a UI grotesque with a slightly squared, humanist
 *   skeleton — quiet at 11–15px without collapsing into the same Inter-like
 *   voice every generated interface reaches for.
 * - `instrumentSerif` is the display voice, used sparingly: the module title in
 *   the workspace header and the words that introduce a surface. This is where
 *   the personality lives.
 * - `geistMono` is the data voice: timers, countdowns, clock times and key
 *   hints, where digits must not jitter.
 */
export const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

import localFont from "next/font/local";

/**
 * PulseFlow type system — Notion Design System (Tatami)
 *
 * Self-hosted variable fonts loaded locally from `public/fonts/`.
 * Ensures 100% reliable rendering offline, in development, and in production,
 * immune to external Google Fonts CDN or network failures.
 */
export const inter = localFont({
  src: "../public/fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Ubuntu",
    "Cantarell",
    "Noto Sans",
    "Arial",
    "sans-serif",
  ],
});

export const geistMono = localFont({
  src: "../public/fonts/geist-mono-variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

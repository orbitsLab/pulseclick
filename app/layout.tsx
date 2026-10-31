import type { Metadata, Viewport } from "next";
import { inter, geistMono } from "./fonts";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#191919",
};

export const metadata: Metadata = {
  title: "PulseFlow — Tasks, Schedule, Habits & Focus",
  description:
    "Capture tasks in natural language, plan them on a calendar and timeline, keep habits on track, and review how the week actually went.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${inter.className} font-sans h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} font-sans min-h-full flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[var(--app-accent)]/20`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

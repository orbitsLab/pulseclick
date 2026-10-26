import type { Metadata } from "next";
import { onest, instrumentSerif, geistMono } from "./fonts";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toast";

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
      className={`${onest.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[var(--app-accent)]/30">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

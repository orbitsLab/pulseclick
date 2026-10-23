"use client";

import React from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useTickTickContext } from "@/context/ticktick-context";

export function SyncIndicator() {
  const { isBackgroundFetching, refetchAll } = useTickTickContext();

  return (
    <button
      type="button"
      onClick={() => refetchAll()}
      title={isBackgroundFetching ? "Background fetching updates..." : "Click to refresh all workspace data"}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--tt-border)]/70 bg-[var(--tt-panel-alt)]/60 px-2 py-1 tt-meta transition-all hover:bg-[var(--tt-panel-alt)] active:scale-95 cursor-pointer"
    >
      {isBackgroundFetching ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-[var(--tt-accent-text)]" />
          <span className="hidden md:inline font-medium text-[var(--tt-accent-text)]">
            Syncing...
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-500/80" />
          <span className="hidden md:inline text-[var(--tt-muted)]">
            Synced
          </span>
        </>
      )}
    </button>
  );
}

"use client";

import React from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useWorkspaceContext } from "@/context/workspace-context";

export function SyncIndicator() {
  const { isBackgroundFetching, refetchAll } = useWorkspaceContext();

  return (
    <button
      type="button"
      onClick={() => refetchAll()}
      title={isBackgroundFetching ? "Background fetching updates..." : "Click to refresh all workspace data"}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)]/70 bg-[var(--app-panel-alt)]/60 px-2 py-1 app-meta transition-all hover:bg-[var(--app-panel-alt)] active:scale-95 cursor-pointer"
    >
      {isBackgroundFetching ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-[var(--app-accent-text)]" />
          <span className="hidden md:inline font-medium text-[var(--app-accent-text)]">
            Syncing...
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-500/80" />
          <span className="hidden md:inline text-[var(--app-muted)]">
            Synced
          </span>
        </>
      )}
    </button>
  );
}

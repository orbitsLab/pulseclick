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
      className="flex items-center gap-1.5 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2 py-1 text-xs text-[var(--app-muted)] transition-colors hover:bg-[var(--app-panel-hover)] hover:text-[var(--app-text)] cursor-pointer"
    >
      {isBackgroundFetching ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin text-[var(--app-accent)]" />
          <span className="hidden md:inline font-medium text-[var(--app-accent)]">
            Syncing...
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">
            Synced
          </span>
        </>
      )}
    </button>
  );
}

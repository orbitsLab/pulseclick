import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-8 w-full min-w-0 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1 text-xs sm:text-sm text-[var(--app-text)] shadow-[0_1px_2px_rgba(15,15,15,0.04)] outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-xs file:text-foreground placeholder:text-[var(--app-muted)]/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:border-[var(--app-accent)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/35",
        "aria-invalid:border-[#e03e3e] aria-invalid:ring-[#e03e3e]/20",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
        type === "file" &&
          "p-0 pr-3 text-[var(--app-muted)]/70 italic file:me-3 file:h-full file:border-0 file:border-[var(--app-border)] file:border-r file:border-solid file:bg-transparent file:px-2.5 file:font-medium file:text-xs file:not-italic",
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };

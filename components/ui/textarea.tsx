import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-16 w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5 text-xs sm:text-sm text-[var(--app-text)] shadow-[0_1px_2px_rgba(15,15,15,0.04)] outline-none transition-colors placeholder:text-[var(--app-muted)]/70 focus-visible:border-[var(--app-accent)] focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/35 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      data-slot="textarea"
      {...props}
    />
  );
}
Textarea.displayName = "Textarea";

export { Textarea };

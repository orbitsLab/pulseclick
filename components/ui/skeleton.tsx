import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[var(--app-panel-alt)]/80 border border-[var(--app-border)]/30", className)}
      {...props}
    />
  )
}

export { Skeleton }

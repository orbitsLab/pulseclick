import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[3px] border border-transparent px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/40 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--app-accent)]/15 text-[var(--app-accent-text)] border-[var(--app-accent)]/20 [a]:hover:bg-[var(--app-accent)]/25",
        secondary:
          "bg-[var(--app-panel-alt)] text-[var(--app-text)] border-[var(--app-border)]/70 [a]:hover:bg-[var(--app-hover)]",
        destructive:
          "bg-[#e03e3e]/15 text-[#e03e3e] dark:text-[#fce9e7] border-[#e03e3e]/20 [a]:hover:bg-[#e03e3e]/25",
        outline:
          "border-[var(--app-border)] text-[var(--app-text)] [a]:hover:bg-[var(--app-hover)]",
        ghost:
          "hover:bg-[var(--app-hover)] text-[var(--app-muted)]",
        link: "text-[var(--app-accent)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
